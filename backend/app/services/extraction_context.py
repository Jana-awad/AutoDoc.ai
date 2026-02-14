"""
Load template and fields from DB for LLM extraction.
Returns a simple structure used to build the extraction prompt.
"""
from sqlalchemy.orm import Session

from app.crud.crud_document import get_document
from app.crud.crud_template import get_template
from app.crud.crud_field import list_fields


def get_extraction_context(db: Session, document_id: int) -> dict | None:
    """
    Load template and fields for a document. Used to build the LLM prompt.

    Args:
        db: Database session
        document_id: ID of the document being processed

    Returns:
        Dict with template_name, template_description, and fields (list of
        field dicts with id, name, field_type, description, required).
        Returns None if document or template not found.
    """
    doc = get_document(db, document_id)
    if not doc or doc.template_id is None:
        return None

    template = get_template(db, doc.template_id)
    if not template:
        return None

    fields = list_fields(db, doc.template_id)
    field_list = [
        {
            "id": f.id,
            "name": f.name,
            "field_type": f.field_type or "text",
            "description": f.description or "",
            "required": f.required,
        }
        for f in fields
    ]

    return {
        "template_name": template.name,
        "template_description": template.description or "",
        "fields": field_list,
    }
