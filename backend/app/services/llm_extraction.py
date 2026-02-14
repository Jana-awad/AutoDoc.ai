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


def calculate_confidence(extraction_result: dict, context: dict) -> dict[str, float]:
    """
    Assign a confidence score (0.0-1.0) per field from extraction result.
    Missing required -> 0.0, missing optional -> 0.1, present -> 0.9.

    Args:
        extraction_result: Dict from extract_with_llm (field_name -> value).
        context: Same context used for extraction (must have "fields" with name, required).

    Returns:
        Dict mapping field name to confidence float.
    """
    out: dict[str, float] = {}
    fields = context.get("fields", [])
    for f in fields:
        name = f.get("name", "")
        required = f.get("required", False)
        value = extraction_result.get(name)
        is_empty = value is None or (isinstance(value, str) and value.strip() == "")
        if is_empty:
            out[name] = 0.0 if required else 0.1
        else:
            out[name] = 0.9
    return out
