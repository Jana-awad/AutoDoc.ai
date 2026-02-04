from sqlalchemy.orm import Session
from app.models.document import Document
from app.core.enums import UserRole
from app.models.extraction import Extraction
from app.models.field import Field
from datetime import datetime


def create_document(db: Session, client_id: int, template_id: int | None, file_url: str) -> Document:
    doc = Document(
        client_id=client_id,
        template_id=template_id,
        file_url=file_url,
        status="uploaded",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def get_document(db: Session, document_id: int) -> Document | None:
    return db.query(Document).filter(Document.id == document_id).first()

def list_documents_for_user(db: Session, user) -> list[Document]:
    q = db.query(Document)

    # superadmin sees everything
    if user.role != UserRole.SUPER_ADMIN:
        if user.client_id is None:
            return []
        q = q.filter(Document.client_id == user.client_id)

    return q.order_by(Document.created_at.desc()).all()

def set_document_status(db: Session, doc: Document, status: str) -> Document:
    doc.status = status
    if status == "done":
        doc.processed_at = datetime.utcnow()
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

def delete_extractions_for_document(db: Session, document_id: int) -> None:
    db.query(Extraction).filter(Extraction.document_id == document_id).delete()
    db.commit()

def create_mock_extractions(db: Session, document_id: int, template_id: int) -> int:
    fields = db.query(Field).filter(Field.template_id == template_id).all()
    count = 0
    for f in fields:
        ex = Extraction(
            document_id=document_id,
            field_id=f.id,
            value_text=f"mock_{f.name}",
            confidence=0.90,
        )
        db.add(ex)
        count += 1
    db.commit()
    return count