"""LLM extraction service.

Builds prompts (using the template's prompts when provided), calls OpenAI's
chat completions API, and returns a dict of field name → extracted value.

Two entry points:

* ``extract_with_llm(cleaned_text, context)`` — used by the document-processing
  pipeline. Receives the rich context dict produced by
  ``app.services.extraction_context.get_extraction_context``.
* ``generate_from_template(db, template, document_text, variables)`` — used by
  the Template Builder "Test prompt" feature. Operates straight off a
  ``Template`` ORM object so you don't need a real document.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any

import openai
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.crud_field import list_fields
from app.models.template import Template

logger = logging.getLogger(__name__)


_DEFAULT_SYSTEM_PROMPT = (
    "You are an expert at extracting structured data from documents. "
    "Your task is to return only a valid JSON object. Do not include markdown, "
    "code fences, or any explanation."
)


# ---------------------------------------------------------------------------
# Prompt assembly
# ---------------------------------------------------------------------------


_VARIABLE_PATTERN = re.compile(r"{{\s*([a-zA-Z0-9_\.]+)\s*}}")


def render_variables(text: str | None, variables: dict[str, Any] | None) -> str:
    """Replace ``{{ variable_name }}`` placeholders with values from ``variables``.

    Unknown placeholders are left as ``{{ name }}`` so the user can spot them.
    """
    if not text:
        return ""
    if not variables:
        return text

    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        if key in variables:
            return str(variables[key])
        return match.group(0)

    return _VARIABLE_PATTERN.sub(repl, text)


def _format_field_line(f: dict[str, Any]) -> str:
    name = f.get("name", "")
    field_type = f.get("field_type", "text")
    description = f.get("description") or f.get("extraction_hint") or ""
    positioning = f.get("positioning_hint") or f.get("document_position") or ""
    example = f.get("example_value") or ""
    fmt_hint = f.get("format_hint") or f.get("validation_rules") or ""
    required = f.get("required", False)

    bits: list[str] = [f"- {name} ({field_type})"]
    if required:
        bits.append("(required)")
    extras: list[str] = []
    if description:
        extras.append(description)
    if positioning:
        extras.append(f"position: {positioning}")
    if example:
        extras.append(f'example: "{example}"')
    if fmt_hint:
        extras.append(f"format: {fmt_hint}")
    if extras:
        bits.append("— " + " | ".join(extras))
    return " ".join(bits)


def _build_messages(
    cleaned_text: str,
    context: dict[str, Any],
    *,
    variables: dict[str, Any] | None = None,
) -> list[dict[str, str]]:
    """Compose chat messages combining the template's prompt blocks (if any)
    with the document text. Falls back to a generic prompt when the template
    didn't define one — keeping behavior identical to the legacy pipeline."""
    template_name = context.get("template_name", "Document")
    template_description = context.get("template_description", "") or ""
    fields = context.get("fields", [])
    prompts = context.get("template_prompts") or {}

    system_content = (
        render_variables(prompts.get("system_prompt"), variables)
        or _DEFAULT_SYSTEM_PROMPT
    )

    field_lines = "\n".join(_format_field_line(f) for f in fields)

    sections: list[str] = [f"Template: {template_name}."]
    if template_description:
        sections.append(f"Description: {template_description}.")

    extraction_instructions = render_variables(
        prompts.get("extraction_instructions"), variables
    )
    if extraction_instructions:
        sections.append(extraction_instructions)
    else:
        sections.append(
            "Extract the following fields from the document below. Return a JSON object "
            "with exactly these keys (use null for missing values):"
        )

    if field_lines:
        sections.append("Fields to extract:\n" + field_lines)

    output_format_rules = render_variables(prompts.get("output_format_rules"), variables)
    if output_format_rules:
        sections.append("Output format rules:\n" + output_format_rules)

    json_template = render_variables(prompts.get("json_output_template"), variables)
    if json_template:
        sections.append("Expected JSON shape:\n" + json_template)

    edge_case_rules = render_variables(prompts.get("edge_case_handling_rules"), variables)
    if edge_case_rules:
        sections.append("Edge case handling:\n" + edge_case_rules)

    if cleaned_text:
        sections.append(f"Document text:\n---\n{cleaned_text}\n---")

    sections.append("Return only the JSON object, no other text.")

    user_content = "\n\n".join(sections)
    return [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_content},
    ]


# ---------------------------------------------------------------------------
# OpenAI invocation
# ---------------------------------------------------------------------------


def _parse_json_from_response(content: str) -> dict:
    """Strip optional markdown code fences from the LLM output and parse JSON."""
    text = content.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


def _resolve_runtime(
    template_prompts: dict[str, Any] | None,
) -> tuple[str, dict[str, Any]]:
    """Resolve the OpenAI model name and chat completion kwargs.

    Per-template overrides take precedence over global ``settings`` defaults.
    """
    template_prompts = template_prompts or {}
    model = template_prompts.get("llm_model") or settings.OPENAI_MODEL

    extra: dict[str, Any] = {}
    temperature = template_prompts.get("llm_temperature")
    if temperature is not None:
        extra["temperature"] = float(temperature)
    max_tokens = template_prompts.get("llm_max_tokens")
    if max_tokens:
        extra["max_tokens"] = int(max_tokens)
    return model, extra


def _call_openai(messages: list[dict[str, str]], template_prompts: dict[str, Any] | None):
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set")

    model, extra = _resolve_runtime(template_prompts)
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        return (
            client.chat.completions.create(model=model, messages=messages, **extra),
            model,
        )
    except openai.RateLimitError as e:
        raise ValueError(
            "OpenAI quota or rate limit exceeded. Check your plan/billing or wait and retry."
        ) from e
    except openai.AuthenticationError as e:
        raise ValueError("OpenAI authentication failed. Check your API key.") from e
    except openai.APIError as e:
        raise ValueError(f"OpenAI API error: {e}") from e


def extract_with_llm(cleaned_text: str, context: dict) -> dict:
    """Call OpenAI to extract field values from cleaned document text.

    Used by the document-processing pipeline (after OCR).
    """
    if not cleaned_text or not context or not context.get("fields"):
        return {}

    messages = _build_messages(cleaned_text, context)
    response, _model = _call_openai(messages, context.get("template_prompts"))

    content = response.choices[0].message.content
    if not content:
        raise ValueError("OpenAI returned empty response")

    return _parse_json_from_response(content)


# ---------------------------------------------------------------------------
# Builder "test prompt" support
# ---------------------------------------------------------------------------


def _template_to_context(db: Session, template: Template) -> dict[str, Any]:
    """Build a context dict from a Template ORM instance (used by the
    builder's test feature)."""
    fields = list_fields(db, template.id)
    field_list: list[dict[str, Any]] = []
    for f in fields:
        field_list.append(
            {
                "id": f.id,
                "name": f.name,
                "label": (getattr(f, "label", None) or f.name or "").strip(),
                "field_type": (f.field_type or "text").strip(),
                "description": (f.description or "").strip()
                or (f.extraction_prompt or "").strip(),
                "extraction_hint": (f.extraction_prompt or "").strip(),
                "positioning_hint": (f.positioning_hint or "").strip(),
                "example_value": (f.example_value or "").strip(),
                "format_hint": (f.format_hint or "").strip(),
                "required": bool(f.required),
            }
        )

    return {
        "template_id": template.id,
        "template_name": template.name,
        "template_description": template.description or "",
        "template_prompts": {
            "system_prompt": template.system_prompt,
            "extraction_instructions": template.extraction_instructions,
            "output_format_rules": template.output_format_rules,
            "json_output_template": template.json_output_template,
            "edge_case_handling_rules": template.edge_case_handling_rules,
            "llm_model": template.llm_model,
            "llm_temperature": (
                float(template.llm_temperature)
                if template.llm_temperature is not None
                else None
            ),
            "llm_max_tokens": template.llm_max_tokens,
        },
        "fields": field_list,
    }


def generate_from_template(
    db: Session,
    template: Template,
    *,
    document_text: str,
    variables: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run the LLM with a template's prompts and return the parsed JSON.

    This is meant for the "Test prompt" feature in the Template Builder. It
    accepts ad-hoc document text (e.g. an OCR snippet pasted by the operator)
    or just variables — both are optional. If no document text is given the LLM
    still receives the full prompt, which is useful to validate the prompt
    structure.
    """
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set on the backend")

    context = _template_to_context(db, template)
    messages = _build_messages(
        document_text or "", context, variables=variables or {}
    )
    response, model = _call_openai(messages, context.get("template_prompts"))
    content = response.choices[0].message.content or ""

    extraction: dict[str, Any]
    try:
        extraction = _parse_json_from_response(content)
    except json.JSONDecodeError:
        # Return the raw content so the UI can display it; extraction is empty.
        extraction = {}

    return {
        "template_id": template.id,
        "template_key": template.template_key,
        "model": model,
        "extraction": extraction,
        "raw_response": content,
    }


# ---------------------------------------------------------------------------
# Confidence scoring
# ---------------------------------------------------------------------------


LOW_CONFIDENCE_THRESHOLD = 0.5


def _validate_date_pattern(value: str) -> tuple[bool, float]:
    if not value or not isinstance(value, str):
        return False, 0.0

    value = value.strip()
    date_patterns = [
        r"^\d{4}-\d{2}-\d{2}$",
        r"^\d{2}/\d{2}/\d{4}$",
        r"^\d{2}-\d{2}-\d{4}$",
        r"^\d{4}/\d{2}/\d{2}$",
        r"^\d{1,2}/\d{1,2}/\d{4}$",
        r"^\d{1,2}-\d{1,2}-\d{4}$",
    ]
    matches = sum(1 for pattern in date_patterns if re.match(pattern, value))
    if matches > 0:
        year_match = re.search(r"(\d{4})", value)
        if year_match:
            year = int(year_match.group(1))
            if 1900 <= year <= 2100:
                return True, 0.9
            return True, 0.6
        return True, 0.85

    if re.search(r"\d{1,4}[-/]\d{1,2}", value) or re.search(r"\d{1,2}[-/]\d{1,4}", value):
        return False, 0.4
    return False, 0.0


def _validate_number_pattern(value: str) -> tuple[bool, float]:
    if not value or not isinstance(value, str):
        return False, 0.0
    value = value.strip()
    cleaned = (
        value.replace("$", "").replace("€", "").replace("£", "").replace(",", "").strip()
    )
    if re.match(r"^-?\d+$", cleaned):
        return True, 0.9
    if re.match(r"^-?\d+\.\d+$", cleaned):
        return True, 0.9
    if re.match(r"^[$€£]\s*\d+([.,]\d+)?$", value):
        return True, 0.9
    if re.match(r"^-?\d{1,3}(,\d{3})*(\.\d+)?$", cleaned):
        return True, 0.9
    if re.search(r"\d+", value):
        return False, 0.5
    return False, 0.0


def _validate_email_pattern(value: str) -> tuple[bool, float]:
    if not value or not isinstance(value, str):
        return False, 0.0
    value = value.strip()
    if re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", value):
        return True, 0.9
    if "@" in value:
        return False, 0.4
    return False, 0.0


def _validate_phone_pattern(value: str) -> tuple[bool, float]:
    if not value or not isinstance(value, str):
        return False, 0.0
    value = value.strip()
    cleaned = re.sub(r"[-\s()]", "", value)
    if re.match(r"^\+?\d{10,15}$", cleaned):
        return True, 0.9
    if re.match(r"^\+?[\d\s\-()]{10,}$", value):
        return True, 0.85
    if re.search(r"\d{7,}", value):
        return False, 0.4
    return False, 0.0


def _detect_ambiguous_value(value: str) -> bool:
    if not value or not isinstance(value, str):
        return False
    value_lower = value.lower().strip()
    indicators = [
        "?",
        "unknown",
        "n/a",
        "na",
        "none",
        "null",
        "undefined",
        "maybe",
        "possibly",
        "perhaps",
        "unclear",
        "ambiguous",
        "see",
        "refer",
        "check",
        "verify",
        "confirm",
    ]
    if any(indicator in value_lower for indicator in indicators):
        return True
    if re.search(r"\s+or\s+|\s*/\s*|\s*\|\s*", value_lower):
        return True
    if len(value.strip()) < 2:
        return True
    return False


def _validate_field_by_type(value: str, field_type: str) -> tuple[bool, float]:
    if not value:
        return False, 0.0
    field_type_lower = (field_type or "text").lower()
    if field_type_lower in ("date", "datetime"):
        return _validate_date_pattern(value)
    if field_type_lower in (
        "number",
        "integer",
        "decimal",
        "float",
        "currency",
        "amount",
        "price",
    ):
        return _validate_number_pattern(value)
    if field_type_lower == "email":
        return _validate_email_pattern(value)
    if field_type_lower in ("phone", "telephone", "phone_number"):
        return _validate_phone_pattern(value)
    if len(value.strip()) > 0:
        return True, 0.85
    return False, 0.0


def calculate_confidence(extraction_result: dict, context: dict) -> dict[str, float]:
    out: dict[str, float] = {}
    for f in context.get("fields", []):
        name = f.get("name", "")
        required = f.get("required", False)
        field_type = f.get("field_type", "text")
        value = extraction_result.get(name)

        is_empty = value is None or (isinstance(value, str) and value.strip() == "")
        if is_empty:
            out[name] = 0.0 if required else 0.1
            continue

        value_str = str(value).strip()
        if _detect_ambiguous_value(value_str):
            out[name] = 0.4
            continue

        is_valid, pattern_confidence = _validate_field_by_type(value_str, field_type)
        if is_valid:
            out[name] = pattern_confidence
        else:
            if pattern_confidence > 0.0:
                out[name] = pattern_confidence
            else:
                out[name] = 0.3 if required else 0.5

    return out


def detect_low_confidence_fields(
    confidence_dict: dict[str, float], threshold: float | None = None
) -> list[str]:
    if threshold is None:
        threshold = LOW_CONFIDENCE_THRESHOLD
    return [
        field_name
        for field_name, confidence in confidence_dict.items()
        if confidence < threshold
    ]
