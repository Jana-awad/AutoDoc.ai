"""Aggregate Postgres metrics for the Super Admin dashboard bundle."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import and_, func, or_, text
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.crud.crud_platform_config import get_platform_config
from app.models.api_log import ApiLog
from app.models.client import Client
from app.models.document import Document
from app.models.extraction import Extraction
from app.models.payment import Payment
from app.models.super_audit_log import SuperAuditLog
from app.models.template import Template
from app.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _start_of_utc_day(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def build_key_metrics(db: Session) -> dict[str, Any]:
    now = _utcnow()
    day_start = _start_of_utc_day(now)
    week_ago = now - timedelta(days=7)

    done_total = (
        db.query(func.count(Document.id)).filter(Document.status == "done").scalar() or 0
    )
    failed_total = (
        db.query(func.count(Document.id)).filter(Document.status == "failed").scalar() or 0
    )
    denom = done_total + failed_total
    success_rate = round(100.0 * done_total / denom, 1) if denom else 100.0

    api_today = (
        db.query(func.count(ApiLog.id)).filter(ApiLog.created_at >= day_start).scalar() or 0
    )

    active_users = (
        db.query(func.count(User.id))
        .filter(User.is_active.is_(True), User.client_id.isnot(None))
        .scalar()
        or 0
    )

    total_clients = db.query(func.count(Client.id)).scalar() or 0
    total_templates = db.query(func.count(Template.id)).scalar() or 0

    avg_conf = (
        db.query(func.avg(Extraction.confidence))
        .filter(Extraction.confidence.isnot(None), Extraction.created_at >= week_ago)
        .scalar()
    )
    accuracy_percent = (
        round(float(avg_conf) * 100.0, 1) if avg_conf is not None else round(success_rate, 1)
    )

    return {
        "totalDocuments": int(done_total),
        "successRate": float(success_rate),
        "apiCallsToday": int(api_today),
        "activeUsers": int(active_users),
        "totalClients": int(total_clients),
        "totalTemplates": int(total_templates),
        "accuracyPercent": float(accuracy_percent),
        "failedDocs": int(failed_total),
        "quotaRemaining": None,
        "quotaUnlimited": True,
        "changes": {
            "totalDocuments": None,
            "successRate": None,
            "apiCallsToday": None,
            "activeUsers": None,
            "accuracyPercent": None,
        },
    }


def build_top_clients(db: Session, limit: int = 8) -> list[dict[str, Any]]:
    since = _utcnow() - timedelta(days=30)
    sub_docs = (
        db.query(Document.client_id, func.count(Document.id).label("dc"))
        .filter(Document.created_at >= since)
        .group_by(Document.client_id)
        .subquery()
    )
    sub_err = (
        db.query(ApiLog.client_id, func.count(ApiLog.id).label("ec"))
        .filter(ApiLog.created_at >= since, ApiLog.status_code >= 400)
        .group_by(ApiLog.client_id)
        .subquery()
    )
    sub_api = (
        db.query(ApiLog.client_id, func.count(ApiLog.id).label("ac"))
        .filter(ApiLog.created_at >= since)
        .group_by(ApiLog.client_id)
        .subquery()
    )
    q = (
        db.query(
            Client,
            func.coalesce(sub_docs.c.dc, 0).label("documents_processed"),
            func.coalesce(sub_api.c.ac, 0).label("api_calls"),
            func.coalesce(sub_err.c.ec, 0).label("error_count"),
        )
        .outerjoin(sub_docs, sub_docs.c.client_id == Client.id)
        .outerjoin(sub_api, sub_api.c.client_id == Client.id)
        .outerjoin(sub_err, sub_err.c.client_id == Client.id)
        .order_by(func.coalesce(sub_docs.c.dc, 0).desc())
        .limit(limit)
    )
    rows = q.all()
    out: list[dict[str, Any]] = []
    for client, docs, api_c, err_c in rows:
        out.append(
            {
                "id": client.id,
                "name": client.name or client.company_name,
                "email": client.email,
                "documentsProcessed": int(docs or 0),
                "apiCalls": int(api_c or 0),
                "errorCount": int(err_c or 0),
            }
        )
    return out


def _activity_type_from_endpoint(endpoint: str) -> str:
    ep = (endpoint or "").lower()
    if "process" in ep:
        return "template"
    if "template" in ep:
        return "template"
    if "fail" in ep or (endpoint and " 5" in endpoint):
        return "failed"
    if " 4" in (endpoint or ""):
        return "api_error"
    if "auth" in ep or "login" in ep:
        return "user"
    return "default"


def build_recent_activity(db: Session, limit: int = 25) -> list[dict[str, Any]]:
    rows = (
        db.query(ApiLog)
        .order_by(ApiLog.created_at.desc())
        .limit(limit)
        .all()
    )
    out: list[dict[str, Any]] = []
    for r in rows:
        ts = r.created_at.isoformat() if r.created_at else ""
        st = f" HTTP {r.status_code}" if r.status_code else ""
        msg = f"{r.endpoint or 'Request'}{st}"
        sc = r.status_code or 0
        typ = "failed" if sc >= 500 else "api_error" if sc >= 400 else _activity_type_from_endpoint(r.endpoint or "")
        out.append(
            {
                "id": f"api-{r.id}",
                "type": typ,
                "message": msg,
                "timestamp": ts,
            }
        )
    return out


def build_system_health(db: Session) -> dict[str, Any]:
    now = _utcnow()
    hour_ago = now - timedelta(hours=1)
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    fivexx_hour = (
        db.query(func.count(ApiLog.id))
        .filter(ApiLog.created_at >= hour_ago, ApiLog.status_code >= 500)
        .scalar()
        or 0
    )
    total_hour = (
        db.query(func.count(ApiLog.id)).filter(ApiLog.created_at >= hour_ago).scalar() or 0
    )
    error_spike = bool(total_hour and fivexx_hour / max(1, total_hour) > 0.15 and fivexx_hour >= 3)

    week_ago = now - timedelta(days=7)
    avg_ms = (
        db.query(
            func.avg(
                func.extract("epoch", Document.processed_at - Document.created_at) * 1000.0
            )
        )
        .filter(
            Document.status == "done",
            Document.processed_at.isnot(None),
            Document.processed_at >= week_ago,
        )
        .scalar()
    )
    avg_processing = int(float(avg_ms)) if avg_ms is not None else None

    trend = "neutral"
    if avg_processing and avg_processing > 120_000:
        trend = "down"
    elif avg_processing and avg_processing < 45_000:
        trend = "up"

    return {
        "apiStatus": "operational" if db_ok else "degraded",
        "errorSpike": error_spike,
        "avgProcessingTimeMs": avg_processing,
        "trend": trend,
    }


def build_ai_analytics(db: Session) -> dict[str, Any]:
    week_ago = _utcnow() - timedelta(days=7)
    done = (
        db.query(func.count(Document.id))
        .filter(Document.status == "done", Document.created_at >= week_ago)
        .scalar()
        or 0
    )
    failed = (
        db.query(func.count(Document.id))
        .filter(Document.status == "failed", Document.created_at >= week_ago)
        .scalar()
        or 0
    )
    ocr_proxy = round(100.0 * done / max(1, done + failed), 1)

    avg_conf = (
        db.query(func.avg(Extraction.confidence))
        .filter(Extraction.confidence.isnot(None), Extraction.created_at >= week_ago)
        .scalar()
    )
    extraction_score = round(float(avg_conf) * 100.0, 1) if avg_conf is not None else None

    return {
        "ocrAccuracyRate": ocr_proxy,
        "extractionConfidenceScore": extraction_score,
        "templatePerformance": [],
        "latencyTrend": [],
    }


def build_template_intelligence(db: Session) -> dict[str, Any]:
    week_ago = _utcnow() - timedelta(days=7)
    active = (
        db.query(func.count(Template.id))
        .filter(or_(Template.status.is_(None), func.lower(Template.status) == "active"))
        .scalar()
        or 0
    )
    draft = db.query(func.count(Template.id)).filter(func.lower(Template.status) == "draft").scalar() or 0
    failed_tpl = (
        db.query(func.count(func.distinct(Document.template_id)))
        .filter(
            Document.status == "failed",
            Document.template_id.isnot(None),
            Document.created_at >= week_ago,
        )
        .scalar()
        or 0
    )
    recent = (
        db.query(Template)
        .order_by(Template.updated_at.desc().nullslast(), Template.id.desc())
        .limit(6)
        .all()
    )
    recent_out = []
    for t in recent:
        ua = t.updated_at.isoformat() if getattr(t, "updated_at", None) else None
        recent_out.append({"id": t.id, "name": t.name, "updatedAt": ua})
    return {
        "activeCount": int(active),
        "inTrainingCount": int(draft),
        "failedCount": int(failed_tpl),
        "recentlyUpdated": recent_out,
    }


def build_live_api_usage(db: Session) -> dict[str, Any]:
    now = _utcnow()
    hour_ago = now - timedelta(hours=1)
    total = db.query(func.count(ApiLog.id)).filter(ApiLog.created_at >= hour_ago).scalar() or 0
    ok = (
        db.query(func.count(ApiLog.id))
        .filter(
            ApiLog.created_at >= hour_ago,
            ApiLog.status_code.isnot(None),
            ApiLog.status_code >= 200,
            ApiLog.status_code < 300,
        )
        .scalar()
        or 0
    )
    bad = (
        db.query(func.count(ApiLog.id))
        .filter(
            ApiLog.created_at >= hour_ago,
            ApiLog.status_code.isnot(None),
            or_(ApiLog.status_code >= 400, ApiLog.status_code < 200),
        )
        .scalar()
        or 0
    )
    rpm = round(total / 60.0, 2) if total else 0.0
    success_rate = round(100.0 * ok / max(1, total), 1)
    error_rate = round(100.0 * bad / max(1, total), 1)
    pc = get_platform_config(db)
    throttle = bool(pc.uploads_paused or not pc.document_processing_enabled)
    return {
        "requestsPerMinute": rpm,
        "successRate": success_rate,
        "errorRate": error_rate,
        "throttlingActive": throttle,
        "unlimitedUsage": True,
    }


def build_audit_entries(db: Session, limit: int = 18) -> list[dict[str, Any]]:
    rows = (
        db.query(SuperAuditLog)
        .options(joinedload(SuperAuditLog.user))
        .order_by(SuperAuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    out: list[dict[str, Any]] = []
    for r in rows:
        who = ""
        if r.user:
            who = r.user.email or r.user.username or str(r.user_id)
        ts = r.created_at.isoformat() if r.created_at else ""
        out.append(
            {
                "id": f"audit-{r.id}",
                "action": r.action,
                "detail": f"{who}: {r.detail or ''}".strip(),
                "timestamp": ts,
                "type": "audit",
            }
        )
    return out


def build_support_sla(db: Session) -> dict[str, Any]:
    pc = get_platform_config(db)
    sla = "met"
    if pc.incident_title or pc.incident_body:
        sla = "at_risk"
    return {
        "prioritySupport24_7": True,
        "accountManager": pc.incident_title or None,
        "slaStatus": sla,
        "incidentNote": (pc.incident_body or "")[:500] or None,
    }


def build_security_access(db: Session) -> dict[str, Any]:
    users = db.query(User).all()
    dist = {"admin": 0, "editor": 0, "viewer": 0}
    for u in users:
        role = u.role.value if hasattr(u.role, "value") else str(u.role)
        rl = role.lower()
        if "super" in rl or "admin" in rl or "enterprise" in rl or "business" in rl:
            dist["admin"] += 1
        elif "user" in rl and "admin" not in rl:
            dist["viewer"] += 1
        else:
            dist["editor"] += 1
    alerts: list[dict[str, Any]] = []
    pc = get_platform_config(db)
    if not pc.document_processing_enabled:
        alerts.append(
            {
                "id": "flag-processing",
                "severity": "warning",
                "message": "Document processing is disabled platform-wide.",
                "timestamp": pc.updated_at.isoformat() if pc.updated_at else "",
            }
        )
    if pc.uploads_paused:
        alerts.append(
            {
                "id": "flag-uploads",
                "severity": "warning",
                "message": "New document uploads are paused platform-wide.",
                "timestamp": pc.updated_at.isoformat() if pc.updated_at else "",
            }
        )
    return {
        "activeSessions": 0,
        "roleDistribution": dist,
        "securityAlerts": alerts,
    }


def build_dashboard_bundle(db: Session) -> dict[str, Any]:
    return {
        "keyMetrics": build_key_metrics(db),
        "topClients": build_top_clients(db),
        "recentActivity": build_recent_activity(db),
        "systemHealth": build_system_health(db),
        "aiAnalytics": build_ai_analytics(db),
        "templateIntelligence": build_template_intelligence(db),
        "liveApiUsage": build_live_api_usage(db),
        "auditLog": build_audit_entries(db),
        "supportSLA": build_support_sla(db),
        "securityAccess": build_security_access(db),
    }


def redis_ping(url: str | None) -> bool | None:
    if not url or "redis" not in (url or "").lower():
        return None
    try:
        from redis import Redis

        r = Redis.from_url(url, socket_connect_timeout=1.0)
        return bool(r.ping())
    except Exception:
        return False


def build_monitoring_status(db: Session) -> dict[str, Any]:
    checks: list[dict[str, Any]] = []
    try:
        db.execute(text("SELECT 1"))
        checks.append({"id": "postgres", "label": "PostgreSQL", "ok": True, "detail": "SELECT 1"})
    except Exception as e:
        checks.append({"id": "postgres", "label": "PostgreSQL", "ok": False, "detail": str(e)[:200]})

    creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    vision_ok = bool(creds and os.path.isfile(creds))
    checks.append(
        {
            "id": "vision",
            "label": "Google Vision (credentials file)",
            "ok": vision_ok,
            "detail": "Configured" if vision_ok else "Set GOOGLE_APPLICATION_CREDENTIALS",
        }
    )

    openai_ok = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY not in ("default_key", "sk-REPLACE_ME"))
    checks.append(
        {
            "id": "openai",
            "label": "OpenAI API key",
            "ok": openai_ok,
            "detail": "Set in environment" if openai_ok else "Missing or placeholder OPENAI_API_KEY",
        }
    )

    redis_url = settings.CELERY_BROKER_URL
    rp = redis_ping(redis_url)
    if rp is not None:
        checks.append(
            {
                "id": "redis",
                "label": "Redis / Celery broker",
                "ok": rp,
                "detail": "Ping OK" if rp else "Unreachable",
            }
        )

    upload_dir = settings.UPLOAD_DIR
    try:
        os.makedirs(upload_dir, exist_ok=True)
        w_ok = os.access(upload_dir, os.W_OK)
        checks.append(
            {
                "id": "disk",
                "label": "Upload directory",
                "ok": w_ok,
                "detail": upload_dir,
            }
        )
    except Exception as e:
        checks.append({"id": "disk", "label": "Upload directory", "ok": False, "detail": str(e)[:120]})

    pc = get_platform_config(db)
    return {
        "checks": checks,
        "platform": {
            "document_processing_enabled": pc.document_processing_enabled,
            "uploads_paused": pc.uploads_paused,
            "slo_target_percent": pc.slo_target_percent,
        },
    }
