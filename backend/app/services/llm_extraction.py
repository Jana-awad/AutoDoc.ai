"""
LLM extraction using OpenAI.
Builds a prompt from document text + template/fields, calls the API, returns a dict of field_name -> value.
"""
import json
import re

import openai
from openai import OpenAI

from app.core.config import settings


def _build_messages(cleaned_text: str, context: dict) -> list[dict]:
    """
    Build the list of messages for the OpenAI chat API.
    Uses template name/description and field definitions (with descriptions) from context.
    """
    template_name = context.get("template_name", "Document")
    template_description = context.get("template_description", "")
    fields = context.get("fields", [])

    system_content = (
        "You are an expert at extracting structured data from documents. "
        "Your task is to return only a valid JSON object. Do not include markdown, code fences, or any explanation."
    )

    field_lines = []
    for f in fields:
        name = f.get("name", "")
        field_type = f.get("field_type", "text")
        description = f.get("description", "")
        required = f.get("required", False)
        req_label = " (required)" if required else ""
        desc_part = f": {description}" if description else ""
        field_lines.append(f"- {name} ({field_type}){req_label}{desc_part}")

    fields_block = "\n".join(field_lines)
    user_content = f"""Template: {template_name}.
{f"Description: {template_description}." if template_description else ""}

Extract the following fields from the document below. Return a JSON object with exactly these keys (use null for missing values):
{fields_block}

Document text:
---
{cleaned_text}
---

Return only the JSON object, no other text."""

    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_content},
    ]


def _parse_json_from_response(content: str) -> dict:
    """
    Extract JSON from the model response. Strips markdown code blocks if present.
    """
    text = content.strip()
    # Remove ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


def extract_with_llm(cleaned_text: str, context: dict) -> dict:
    """
    Call OpenAI to extract field values from cleaned document text.

    Args:
        cleaned_text: Output from clean_ocr_text (Step 2).
        context: Output from get_extraction_context (Step 3): template_name, template_description, fields.

    Returns:
        Dict mapping field names to extracted values (str or null). Keys match context["fields"][].name.

    Raises:
        ValueError: If OPENAI_API_KEY is missing or API/parsing fails.
    """
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set")

    if not cleaned_text or not context or not context.get("fields"):
        return {}

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    messages = _build_messages(cleaned_text, context)

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            # temperature=0,
        )
    except openai.RateLimitError as e:
        raise ValueError(
            "OpenAI quota or rate limit exceeded. Check your plan/billing or wait and retry."
        ) from e
    except openai.AuthenticationError as e:
        raise ValueError("OpenAI authentication failed. Check your API key.") from e
    except openai.APIError as e:
        raise ValueError(f"OpenAI API error: {e}") from e

    content = response.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned empty response")

    return _parse_json_from_response(content)


# Confidence scoring constants
LOW_CONFIDENCE_THRESHOLD = 0.5  # Fields below this are considered low-confidence


def _validate_date_pattern(value: str) -> tuple[bool, float]:
    """
    Validate date patterns and return (is_valid, confidence).
    Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, etc.
    
    Returns:
        (is_valid, confidence) where confidence is 0.0-1.0
    """
    if not value or not isinstance(value, str):
        return False, 0.0
    
    value = value.strip()
    
    # Common date patterns
    date_patterns = [
        r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
        r'^\d{2}/\d{2}/\d{4}$',  # DD/MM/YYYY or MM/DD/YYYY
        r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
        r'^\d{4}/\d{2}/\d{2}$',  # YYYY/MM/DD
        r'^\d{1,2}/\d{1,2}/\d{4}$',  # M/D/YYYY or D/M/YYYY
        r'^\d{1,2}-\d{1,2}-\d{4}$',  # M-D-YYYY or D-M-YYYY
    ]
    
    matches = sum(1 for pattern in date_patterns if re.match(pattern, value))
    if matches > 0:
        # Valid date format - check if it looks like a real date
        # Basic validation: year should be reasonable (1900-2100)
        year_match = re.search(r'(\d{4})', value)
        if year_match:
            year = int(year_match.group(1))
            if 1900 <= year <= 2100:
                return True, 0.9
            else:
                return True, 0.6  # Valid format but suspicious year
        
        return True, 0.85  # Valid format
    
    # Check for partial date matches (ambiguous)
    if re.search(r'\d{1,4}[-/]\d{1,2}', value) or re.search(r'\d{1,2}[-/]\d{1,4}', value):
        return False, 0.4  # Partial match - ambiguous
    
    return False, 0.0


def _validate_number_pattern(value: str) -> tuple[bool, float]:
    """
    Validate number patterns (integers, decimals, currency).
    
    Returns:
        (is_valid, confidence) where confidence is 0.0-1.0
    """
    if not value or not isinstance(value, str):
        return False, 0.0
    
    value = value.strip()
    
    # Remove currency symbols and commas for validation
    cleaned = value.replace('$', '').replace('€', '').replace('£', '').replace(',', '').strip()
    
    # Integer pattern
    if re.match(r'^-?\d+$', cleaned):
        return True, 0.9
    
    # Decimal pattern
    if re.match(r'^-?\d+\.\d+$', cleaned):
        return True, 0.9
    
    # Currency with symbol
    if re.match(r'^[$€£]\s*\d+([.,]\d+)?$', value):
        return True, 0.9
    
    # Number with commas (thousands separator)
    if re.match(r'^-?\d{1,3}(,\d{3})*(\.\d+)?$', cleaned):
        return True, 0.9
    
    # Partial number match (ambiguous)
    if re.search(r'\d+', value):
        return False, 0.5  # Contains digits but not valid format
    
    return False, 0.0


def _validate_email_pattern(value: str) -> tuple[bool, float]:
    """
    Validate email pattern.
    
    Returns:
        (is_valid, confidence) where confidence is 0.0-1.0
    """
    if not value or not isinstance(value, str):
        return False, 0.0
    
    value = value.strip()
    
    # Basic email pattern
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if re.match(email_pattern, value):
        return True, 0.9
    
    # Partial match (has @ but incomplete)
    if '@' in value:
        return False, 0.4  # Ambiguous - looks like email but invalid
    
    return False, 0.0


def _validate_phone_pattern(value: str) -> tuple[bool, float]:
    """
    Validate phone number patterns.
    
    Returns:
        (is_valid, confidence) where confidence is 0.0-1.0
    """
    if not value or not isinstance(value, str):
        return False, 0.0
    
    value = value.strip()
    
    # Remove common separators
    cleaned = re.sub(r'[-\s()]', '', value)
    
    # Phone patterns (10+ digits)
    if re.match(r'^\+?\d{10,15}$', cleaned):
        return True, 0.9
    
    # Phone with formatting
    if re.match(r'^\+?[\d\s\-()]{10,}$', value):
        return True, 0.85
    
    # Partial match
    if re.search(r'\d{7,}', value):
        return False, 0.4  # Has digits but format unclear
    
    return False, 0.0


def _detect_ambiguous_value(value: str) -> bool:
    """
    Detect if a value looks ambiguous or uncertain.
    Common indicators: "?", "maybe", "unknown", "N/A", multiple values, etc.
    
    Returns:
        True if value appears ambiguous
    """
    if not value or not isinstance(value, str):
        return False
    
    value_lower = value.lower().strip()
    
    # Ambiguity indicators
    ambiguity_indicators = [
        '?', 'unknown', 'n/a', 'na', 'none', 'null', 'undefined',
        'maybe', 'possibly', 'perhaps', 'unclear', 'ambiguous',
        'see', 'refer', 'check', 'verify', 'confirm'
    ]
    
    # Check for ambiguity indicators
    if any(indicator in value_lower for indicator in ambiguity_indicators):
        return True
    
    # Check for multiple possible values (separated by "or", "/", "|")
    if re.search(r'\s+or\s+|\s*/\s*|\s*\|\s*', value_lower):
        return True
    
    # Check if value is too short or too generic
    if len(value.strip()) < 2:
        return True
    
    return False


def _validate_field_by_type(value: str, field_type: str) -> tuple[bool, float]:
    """
    Validate a field value based on its field_type.
    
    Args:
        value: The extracted value (string)
        field_type: The field type (date, number, email, phone, text, etc.)
    
    Returns:
        (is_valid, confidence) where confidence is 0.0-1.0
    """
    if not value:
        return False, 0.0
    
    field_type_lower = (field_type or "text").lower()
    
    if field_type_lower in ['date', 'datetime']:
        return _validate_date_pattern(value)
    elif field_type_lower in ['number', 'integer', 'decimal', 'float', 'currency', 'amount', 'price']:
        return _validate_number_pattern(value)
    elif field_type_lower == 'email':
        return _validate_email_pattern(value)
    elif field_type_lower in ['phone', 'telephone', 'phone_number']:
        return _validate_phone_pattern(value)
    else:
        # Text or unknown type - basic validation
        if len(value.strip()) > 0:
            return True, 0.85  # Present but can't validate pattern
        return False, 0.0


def calculate_confidence(extraction_result: dict, context: dict) -> dict[str, float]:
    """
    Calculate confidence scores (0.0-1.0) per field based on:
    - Presence/absence of value
    - Pattern validation based on field_type
    - Ambiguity detection
    - Required field status
    
    Confidence ranges:
    - 0.0: Missing required field
    - 0.1-0.3: Missing optional field or invalid format
    - 0.4-0.7: Ambiguous or partial match
    - 0.8-0.95: Valid pattern match
    - 0.9+: High confidence (valid and complete)
    
    Args:
        extraction_result: Dict from extract_with_llm (field_name -> value).
        context: Same context used for extraction (must have "fields" with name, required, field_type).
    
    Returns:
        Dict mapping field name to confidence float.
    """
    out: dict[str, float] = {}
    fields = context.get("fields", [])
    
    for f in fields:
        name = f.get("name", "")
        required = f.get("required", False)
        field_type = f.get("field_type", "text")
        value = extraction_result.get(name)
        
        # Check if value is empty
        is_empty = value is None or (isinstance(value, str) and value.strip() == "")
        
        if is_empty:
            # Missing value
            if required:
                out[name] = 0.0  # Missing required field
            else:
                out[name] = 0.1  # Missing optional field
        else:
            # Value is present - validate and score
            value_str = str(value).strip()
            
            # Check for ambiguity first
            is_ambiguous = _detect_ambiguous_value(value_str)
            if is_ambiguous:
                out[name] = 0.4  # Ambiguous value
                continue
            
            # Validate based on field type
            is_valid, pattern_confidence = _validate_field_by_type(value_str, field_type)
            
            if is_valid:
                # Valid pattern - use pattern confidence (usually 0.85-0.9)
                out[name] = pattern_confidence
            else:
                # Invalid or partial pattern match
                if pattern_confidence > 0.0:
                    # Partial match (e.g., has digits but wrong format)
                    out[name] = pattern_confidence  # 0.4-0.6 range
                else:
                    # No pattern match but value exists
                    if required:
                        out[name] = 0.3  # Required field but invalid format
                    else:
                        out[name] = 0.5  # Optional field with invalid format
    
    return out


def detect_low_confidence_fields(confidence_dict: dict[str, float], threshold: float = None) -> list[str]:
    """
    Detect fields with confidence scores below the threshold.
    
    Args:
        confidence_dict: Dict mapping field names to confidence scores
        threshold: Confidence threshold (defaults to LOW_CONFIDENCE_THRESHOLD)
    
    Returns:
        List of field names with low confidence
    """
    if threshold is None:
        threshold = LOW_CONFIDENCE_THRESHOLD
    
    return [
        field_name 
        for field_name, confidence in confidence_dict.items() 
        if confidence < threshold
    ]
