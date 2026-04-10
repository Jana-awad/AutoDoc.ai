"""
Load template and fields from DB for extraction.

This context is the single source of truth for the extraction roadmap:
- template name / description
- field canonical output key
- field label as it appears on document
- field description (where to find it, format, rules)
- field type
- required flag
"""

from sqlalchemy.orm import Session

from app.crud.crud_document import get_document
from app.crud.crud_template import get_template
from app.crud.crud_field import list_fields


def get_extraction_context(db: Session, document_id: int) -> dict | None:
    """
    Load template and fields for a document.

    Returns:
        {
            "template_id": int,
            "template_name": str,
            "template_description": str,
            "fields": [
                {
                    "id": int,
                    "name": str,
                    "label": str,
                    "field_type": str,
                    "description": str,
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
        field_list.append(
            {
                "id": f.id,
                "name": f.name,
                "label": (getattr(f, "label", None) or f.name or "").strip(),
                "field_type": (f.field_type or "text").strip(),
                "description": (f.description or "").strip(),
                "required": bool(f.required),
            }
        )

    return {
        "template_id": template.id,
        "template_name": template.name,
        "template_description": template.description or "",
        "fields": field_list,
    }
