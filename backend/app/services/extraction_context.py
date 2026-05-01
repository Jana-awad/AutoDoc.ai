"""Load template and fields from DB for LLM extraction.

This is the single source of truth for the extraction prompt:
- template name / description / prompt blocks (system, instructions, format,
  json template, edge cases) — all settable from the Template Builder UI
- field canonical key, label, description, type, required, hints, examples
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.crud.crud_document import get_document
from app.crud.crud_field import list_fields
from app.crud.crud_template import get_template


def get_extraction_context(db: Session, document_id: int) -> dict | None:
    """Return everything the LLM needs to extract data for ``document_id``.

    Shape::

        {
            "template_id": int,
            "template_name": str,
            "template_description": str,
            "template_prompts": {
                "system_prompt": str | None,
                "extraction_instructions": str | None,
                "output_format_rules": str | None,
                "json_output_template": str | None,
                "edge_case_handling_rules": str | None,
                "llm_model": str | None,
                "llm_temperature": float | None,
                "llm_max_tokens": int | None,
            },
            "fields": [
                {
                    "id": int,
                    "name": str,
                    "label": str,
                    "field_type": str,
                    "description": str,
                    "extraction_hint": str,
                    "positioning_hint": str,
                    "format_hint": str,
                    "example_value": str,
                    "required": bool,
                }
            ]
        }
    """
    doc = get_document(db, document_id)
    if not doc or doc.template_id is None:
        return None

    template = get_template(db, doc.template_id)
    if not template:
        return None

    fields = list_fields(db, doc.template_id)
    field_list = []
    for f in fields:
        extraction_hint = (getattr(f, "extraction_prompt", None) or "").strip()
        description = (f.description or "").strip() or extraction_hint
        field_list.append(
            {
                "id": f.id,
                "name": f.name,
                "label": (getattr(f, "label", None) or f.name or "").strip(),
                "field_type": (f.field_type or "text").strip(),
                "description": description,
                "extraction_hint": extraction_hint,
                "positioning_hint": (getattr(f, "positioning_hint", None) or "").strip(),
                "format_hint": (getattr(f, "format_hint", None) or "").strip(),
                "example_value": (getattr(f, "example_value", None) or "").strip(),
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
