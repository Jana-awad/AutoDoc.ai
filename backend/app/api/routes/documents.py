import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import settings
from app.core.permissions import ensure_user_can_use_template
from app.crud.crud_document import (
    create_document,
    get_document,
    list_documents_for_user,
    set_document_status,
    delete_extractions_for_document,
    create_mock_extractions,
)
from app.schemas.extraction import ExtractionOut
from app.crud.crud_extraction import list_extractions_for_document
from app.schemas.document_process import DocumentProcessOut
from app.schemas.document import DocumentOut

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentOut)
def upload_document(
    template_id: int = Form(...),
    client_id: int | None = Form(None),   # ✅ add this
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == "superadmin":
        if client_id is None:
            raise HTTPException(status_code=400, detail="client_id is required for superadmin uploads")
        final_client_id = client_id
    else:
        if user.client_id is None:
            raise HTTPException(status_code=400, detail="User has no client")
        final_client_id = user.client_id

    ensure_user_can_use_template(db, user, template_id)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename)[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    client_id = user.client_id if user.role != "superadmin" else (user.client_id or 0)

    doc = create_document(db, client_id=final_client_id, template_id=template_id, file_url=save_path)
    return doc


@router.get("", response_model=list[DocumentOut])
def list_my_documents(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return list_documents_for_user(db, user)


@router.get("/{document_id}", response_model=DocumentOut)
def read_document(
    document_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if user.role != "superadmin":
        if user.client_id is None or doc.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    return doc


@router.post("/{document_id}/process", response_model=DocumentProcessOut)
def process_document(
    document_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # permission
    if user.role != "superadmin":
        if user.client_id is None or doc.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    # status checks
    if doc.status == "processing":
        raise HTTPException(status_code=400, detail="Document is already processing")
    if doc.status == "done":
        raise HTTPException(status_code=400, detail="Document already processed")

    # template must exist
    if doc.template_id is None:
        raise HTTPException(status_code=400, detail="Document has no template_id")

    # set to processing
    set_document_status(db, doc, "processing")

    try:
        delete_extractions_for_document(db, doc.id)
        created = create_mock_extractions(db, doc.id, doc.template_id)
        doc = set_document_status(db, doc, "done")
    except Exception:
        set_document_status(db, doc, "failed")
        raise

    return {"document": doc, "extractions_created": created}
@router.get("/{document_id}/extractions", response_model=list[ExtractionOut])
def get_document_extractions(
    document_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # permission: superadmin any; others only their client
    if user.role != "superadmin":
        if user.client_id is None or doc.client_id != user.client_id:
            raise HTTPException(status_code=403, detail="Forbidden")

    return list_extractions_for_document(db, document_id)
