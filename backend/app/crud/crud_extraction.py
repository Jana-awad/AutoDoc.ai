from sqlalchemy.orm import Session
from app.models.extraction import Extraction

def list_extractions_for_document(db: Session, document_id: int) -> list[Extraction]:
    return (
        db.query(Extraction)
        .filter(Extraction.document_id == document_id)
        .order_by(Extraction.id.asc())
        .all()
    )
