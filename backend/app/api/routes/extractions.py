from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.core.enums import UserRole
from app.schemas.extraction import ExtractionOut, ExtractionCreate, ExtractionUpdate
from app.crud.crud_extraction import (
    list_extractions_for_document,
    get_extraction,
    create_extraction,
    update_extraction,
    delete_extraction,
)
from app.crud.crud_document import get_document

router = APIRouter(prefix="/extractions", tags=["extractions"])


@router.get("/document/{document_id}", response_model=list[ExtractionOut])
def list_for_document(document_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != UserRole.SUPER_ADMIN and doc.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return list_extractions_for_document(db, document_id)


@router.get("/{extraction_id}", response_model=ExtractionOut)
def read_one(extraction_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ex = get_extraction(db, extraction_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Extraction not found")
    doc = get_document(db, ex.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != UserRole.SUPER_ADMIN and doc.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return ex


@router.post("", response_model=ExtractionOut)
def create_route(payload: ExtractionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    doc = get_document(db, payload.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != UserRole.SUPER_ADMIN and doc.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return create_extraction(
        db,
        payload.document_id,
        payload.field_id,
        payload.value_text,
        payload.value_json,
        payload.confidence,
    )


@router.put("/{extraction_id}", response_model=ExtractionOut)
def update_route(
    extraction_id: int,
    payload: ExtractionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ex = get_extraction(db, extraction_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Extraction not found")
    doc = get_document(db, ex.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != UserRole.SUPER_ADMIN and doc.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return update_extraction(db, ex, payload.value_text, payload.value_json, payload.confidence)


@router.delete("/{extraction_id}")
def delete_route(extraction_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ex = get_extraction(db, extraction_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Extraction not found")
    doc = get_document(db, ex.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if user.role != UserRole.SUPER_ADMIN and doc.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    delete_extraction(db, ex)
    return {"detail": "Extraction deleted"}
