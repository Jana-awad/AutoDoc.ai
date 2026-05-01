from typing import Any

from sqlalchemy.orm import Session
from app.models.extraction import Extraction

def list_extractions_for_document(db: Session, document_id: int) -> list[Extraction]:
    return (
        db.query(Extraction)
        .filter(Extraction.document_id == document_id)
        .order_by(Extraction.id.asc())
        .all()
    )

def get_extraction(db: Session, extraction_id: int) -> Extraction | None:
    return db.query(Extraction).filter(Extraction.id == extraction_id).first()

def create_extraction(
    db: Session,
    document_id: int,
    field_id: int | None,
    value_text: str | None,
    value_json: Any | None,
    confidence: float | None,
) -> Extraction:
    ex = Extraction(
        document_id=document_id,
        field_id=field_id,
        value_text=value_text,
        value_json=value_json,
        confidence=confidence,
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex

def update_extraction(
    db: Session,
    extraction: Extraction,
    value_text: str | None,
    value_json: Any | None,
    confidence: float | None,
) -> Extraction:
    if value_text is not None:
        extraction.value_text = value_text
    if value_json is not None:
        extraction.value_json = value_json
    if confidence is not None:
        extraction.confidence = confidence
    db.add(extraction)
    db.commit()
    db.refresh(extraction)
    return extraction

def delete_extraction(db: Session, extraction: Extraction) -> None:
    db.delete(extraction)
    db.commit()
