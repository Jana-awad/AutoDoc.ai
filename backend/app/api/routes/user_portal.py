import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import require_end_user
from app.core.config import settings
from app.core.permissions import ensure_user_can_use_template
from app.crud.crud_document import (
    create_document,
    create_mock_extractions,
    delete_extractions_for_document,
    get_document,
    set_document_status,
)
from app.crud.crud_extraction import list_extractions_for_document
from app.db.deps import get_db
from app.models.document import Document
from app.models.template import Template
from app.models.user import User
from app.schemas.document import DocumentOut
from app.schemas.document_process import DocumentProcessOut
from app.schemas.extraction import ExtractionOut
from app.schemas.user_portal import UserDashboardKpisOut, UserLogListItemOut, UserLogListOut

router = APIRouter(tags=["user-portal"])


def _doc_status_to_log_status(status: str) -> str:
    if status == "done":
        return "success"
    if status == "failed":
        return "failed"
    return "pending"


def _doc_timestamp(doc: Document) -> datetime:
    if doc.status == "done" and doc.processed_at:
        return doc.processed_at
    return doc.created_at


@router.get("/dashboard/kpis", response_model=UserDashboardKpisOut)
def get_user_dashboard_kpis(
    db: Session = Depends(get_db),
    user: User = Depends(require_end_user),
):
    cid = user.client_id
    base = db.query(Document).filter(Document.client_id == cid)
    total_processed = base.filter(Document.status.in_(["done", "failed"])).count()
    successful = base.filter(Document.status == "done").count()
    failed = base.filter(Document.status == "failed").count()

    done_with_times = (
        base.filter(
            Document.status == "done",
            Document.processed_at.isnot(None),
        )
        .all()
    )
    durations_sec: list[float] = []
    for d in done_with_times:
        if d.created_at and d.processed_at:
            delta = (d.processed_at - d.created_at).total_seconds()
            if delta >= 0:
                durations_sec.append(delta)
    avg_sec = sum(durations_sec) / len(durations_sec) if durations_sec else 0.0

    return UserDashboardKpisOut(
        total_documents_processed=total_processed,
        successful_requests=successful,
        failed_requests=failed,
        average_processing_time_seconds=round(avg_sec, 3),
    )


@router.get("/logs", response_model=UserLogListOut)
def list_user_logs(
    db: Session = Depends(get_db),
    user: User = Depends(require_end_user),
):
    cid = user.client_id
    docs = (
        db.query(Document)
        .filter(Document.client_id == cid)
        .order_by(Document.created_at.desc())
        .limit(200)
        .all()
    )
    items = [
        UserLogListItemOut(
            id=d.id,
            template_id=d.template_id,
            document_id=d.id,
            timestamp=_doc_timestamp(d),
            status=_doc_status_to_log_status(d.status),
        )
        for d in docs
    ]
    return UserLogListOut(items=items)


@router.get("/logs/{log_id}")
def get_user_log_detail(
    log_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_end_user),
):
    doc = get_document(db, log_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Log not found")
    if doc.client_id != user.client_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    extractions = list_extractions_for_document(db, log_id)
    template = None
    if doc.template_id:
        t = db.query(Template).filter(Template.id == doc.template_id).first()
        if t:
            template = {"id": t.id, "name": t.name, "description": t.description}

    return {
        "document": DocumentOut.model_validate(doc).model_dump(mode="json"),
        "extractions": [ExtractionOut.model_validate(e).model_dump(mode="json") for e in extractions],
        "template": template,
    }


@router.post("/process", response_model=DocumentProcessOut)
def process_document_upload(
    template_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_end_user),
):
    ensure_user_can_use_template(db, user, template_id)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1].lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    with open(save_path, "wb") as f:
        f.write(file.file.read())

    doc = create_document(db, client_id=user.client_id, template_id=template_id, file_url=save_path)
    doc = set_document_status(db, doc, "processing")

    try:
        delete_extractions_for_document(db, doc.id)
        created = create_mock_extractions(db, doc.id, template_id)
        doc = set_document_status(db, doc, "done")
    except Exception:
        set_document_status(db, doc, "failed")
        raise

    return {"document": doc, "extractions_created": created}
