"""Super-admin snapshot: platform LLM/OCR env, tenant API keys & webhooks, request usage."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_superadmin
from app.core.config import settings
from app.db.deps import get_db
from app.models.api_log import ApiLog
from app.models.client import Client
from app.models.document import Document
from app.models.extraction import Extraction
from app.models.user import User
from app.schemas.super_ai_overview import (
    EndpointHitOut,
    OcrIntegrationOut,
    OpenAIIntegrationOut,
    SuperAiOverviewOut,
    TenantApiSurfaceOut,
    UsageSnapshotOut,
)

router = APIRouter(prefix="/super", tags=["super-ai-overview"])

_PLACEHOLDER_OPENAI_KEYS = frozenset(
    {
        "",
        "default_key",
        "sk-REPLACE_ME",
        "CHANGE_ME",
    }
)


def _openai_configured(raw: str | None) -> bool:
    k = (raw or "").strip()
    return bool(k) and k not in _PLACEHOLDER_OPENAI_KEYS


def _openai_key_hint(raw: str | None) -> str | None:
    if not _openai_configured(raw):
        return None
    k = (raw or "").strip()
    if len(k) <= 4:
        return "****"
    return f"…{k[-4:]}"


def _google_creds_path() -> str | None:
    p = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not p or not str(p).strip():
        return None
    return str(p).strip()


def _google_creds_file_exists() -> bool:
    p = _google_creds_path()
    if not p:
        return False
    try:
        return Path(p).is_file()
    except OSError:
        return False


def _webhook_url_from_settings(raw: dict | None) -> str:
    if not raw or not isinstance(raw, dict):
        return ""
    v = raw.get("webhookUrl") or raw.get("webhook_url")
    if v is None:
        return ""
    return str(v).strip()


@router.get("/ai-overview", response_model=SuperAiOverviewOut)
def read_ai_overview(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
) -> SuperAiOverviewOut:
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)
    week_ago = now - timedelta(days=7)

    raw_openai_key = settings.OPENAI_API_KEY
    openai = OpenAIIntegrationOut(
        configured=_openai_configured(raw_openai_key),
        key_hint=_openai_key_hint(raw_openai_key),
        default_model=settings.OPENAI_MODEL,
    )

    creds_path = _google_creds_path()
    ocr_max_edge = int(os.environ.get("AUTODOC_OCR_MAX_IMAGE_EDGE", "2400") or 2400)
    ocr = OcrIntegrationOut(
        engine="google_cloud_vision",
        service_account_env_set=bool(creds_path),
        service_account_file_exists=_google_creds_file_exists(),
        quota_project_id=settings.GOOGLE_VISION_QUOTA_PROJECT_ID,
        pdf_ocr_dpi=int(settings.PDF_OCR_DPI or 300),
        pdf_embedded_min_chars_skip_ocr=int(settings.PDF_EMBEDDED_MIN_CHARS_TO_SKIP_OCR or 40),
        max_image_edge_px=ocr_max_edge,
    )

    clients = db.query(Client).all()
    total_clients = len(clients)
    with_key = sum(1 for c in clients if (c.api_key or "").strip())
    with_wh = sum(1 for c in clients if _webhook_url_from_settings(c.settings))
    tenants = TenantApiSurfaceOut(
        total_clients=total_clients,
        clients_with_programmatic_api_key=with_key,
        clients_with_webhook_url=with_wh,
    )

    def _count_logs(since: datetime) -> int:
        return int(
            db.query(func.count(ApiLog.id)).filter(ApiLog.created_at >= since).scalar() or 0
        )

    def _count_status_range(lo: int, hi: int) -> int:
        return int(
            db.query(func.count(ApiLog.id))
            .filter(
                ApiLog.created_at >= week_ago,
                ApiLog.status_code.isnot(None),
                ApiLog.status_code >= lo,
                ApiLog.status_code <= hi,
            )
            .scalar()
            or 0
        )

    top_rows = (
        db.query(ApiLog.endpoint, func.count(ApiLog.id).label("cnt"))
        .filter(ApiLog.created_at >= week_ago)
        .group_by(ApiLog.endpoint)
        .order_by(func.count(ApiLog.id).desc())
        .limit(12)
        .all()
    )
    top_endpoints = [EndpointHitOut(endpoint=r[0], count=int(r[1])) for r in top_rows]

    docs_created_7d = int(
        db.query(func.count(Document.id)).filter(Document.created_at >= week_ago).scalar() or 0
    )
    docs_done_7d = int(
        db.query(func.count(Document.id))
        .filter(
            Document.status == "done",
            Document.processed_at.isnot(None),
            Document.processed_at >= week_ago,
        )
        .scalar()
        or 0
    )
    extractions_7d = int(
        db.query(func.count(Extraction.id)).filter(Extraction.created_at >= week_ago).scalar() or 0
    )

    usage = UsageSnapshotOut(
        api_requests_logged_24h=_count_logs(day_ago),
        api_requests_logged_7d=_count_logs(week_ago),
        http_2xx_7d=_count_status_range(200, 299),
        http_4xx_7d=_count_status_range(400, 499),
        http_5xx_7d=_count_status_range(500, 599),
        documents_created_7d=docs_created_7d,
        documents_completed_7d=docs_done_7d,
        extractions_created_7d=extractions_7d,
        top_endpoints_7d=top_endpoints,
    )

    return SuperAiOverviewOut(openai=openai, ocr=ocr, tenants=tenants, usage=usage)
