"""Super-admin operations hub: live dashboard bundle, platform flags, activity, exports."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_superadmin
from app.crud.crud_platform_config import get_platform_config, update_platform_config
from app.crud.crud_super_audit import append_super_audit
from app.db.deps import get_db
from app.models.api_log import ApiLog
from app.models.client import Client
from app.models.document import Document
from app.models.payment import Payment
from app.models.template import Template
from app.models.user import User
from app.schemas.super_hub import (
    ActivityItemOut,
    MonitoringStatusOut,
    OnboardingChecklistOut,
    PaymentReconciliationOut,
    PlatformConfigOut,
    PlatformConfigPatch,
    SuperDashboardBundleOut,
    WebhookTenantOut,
)
from app.services.super_hub_metrics import (
    build_dashboard_bundle,
    build_monitoring_status,
)

router = APIRouter(prefix="/super", tags=["super-hub"])


def _pc_to_out(row) -> PlatformConfigOut:
    return PlatformConfigOut(
        document_processing_enabled=bool(row.document_processing_enabled),
        uploads_paused=bool(row.uploads_paused),
        incident_title=row.incident_title,
        incident_body=row.incident_body,
        slo_target_percent=row.slo_target_percent,
        default_rate_limit_per_minute=row.default_rate_limit_per_minute,
        allowed_llm_models=list(row.allowed_llm_models or []) if row.allowed_llm_models is not None else None,
        blocked_prompt_substrings=list(row.blocked_prompt_substrings or [])
        if row.blocked_prompt_substrings is not None
        else None,
        updated_at=row.updated_at,
        updated_by_user_id=row.updated_by_user_id,
    )


@router.get("/dashboard-bundle", response_model=SuperDashboardBundleOut)
def dashboard_bundle(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    data = build_dashboard_bundle(db)
    return SuperDashboardBundleOut(**data)


@router.get("/monitoring-status", response_model=MonitoringStatusOut)
def monitoring_status(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    raw = build_monitoring_status(db)
    return MonitoringStatusOut(
        checks=raw["checks"],
        platform=raw["platform"],
    )


@router.get("/platform-config", response_model=PlatformConfigOut)
def read_platform_config(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    return _pc_to_out(get_platform_config(db))


@router.patch("/platform-config", response_model=PlatformConfigOut)
def patch_platform_config(
    payload: PlatformConfigPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_superadmin),
):
    body = payload.model_dump(exclude_none=True)
    update_platform_config(
        db,
        document_processing_enabled=body.get("document_processing_enabled"),
        uploads_paused=body.get("uploads_paused"),
        incident_title=body.get("incident_title"),
        incident_body=body.get("incident_body"),
        slo_target_percent=body.get("slo_target_percent"),
        default_rate_limit_per_minute=body.get("default_rate_limit_per_minute"),
        allowed_llm_models=body.get("allowed_llm_models"),
        blocked_prompt_substrings=body.get("blocked_prompt_substrings"),
        updated_by_user_id=user.id,
    )
    append_super_audit(
        db,
        user_id=user.id,
        action="platform_config.patch",
        entity_type="platform_config",
        entity_id=1,
        detail=str(body)[:2000],
        payload=body,
    )
    return _pc_to_out(get_platform_config(db))


@router.get("/activity", response_model=list[ActivityItemOut])
def list_activity(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
    limit: int = Query(50, ge=1, le=200),
    client_id: int | None = None,
    from_ts: datetime | None = Query(None, alias="from"),
    to_ts: datetime | None = Query(None, alias="to"),
):
    q = db.query(ApiLog).order_by(ApiLog.created_at.desc())
    if client_id is not None:
        q = q.filter(ApiLog.client_id == client_id)
    if from_ts is not None:
        q = q.filter(ApiLog.created_at >= from_ts)
    if to_ts is not None:
        q = q.filter(ApiLog.created_at <= to_ts)
    rows = q.limit(limit).all()
    out: list[ActivityItemOut] = []
    for r in rows:
        ts = r.created_at.isoformat() if r.created_at else None
        st = f" HTTP {r.status_code}" if r.status_code else ""
        sc = r.status_code or 0
        typ = "failed" if sc >= 500 else "api_error" if sc >= 400 else "default"
        out.append(
            ActivityItemOut(
                id=f"api-{r.id}",
                type=typ,
                message=f"{r.endpoint or 'Request'}{st}",
                timestamp=ts,
                client_id=r.client_id,
            )
        )
    return out


@router.get("/clients/{client_id}/360")
def client_360(
    client_id: int,
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    from app.models.subscription import Subscription

    docs_total = db.query(func.count(Document.id)).filter(Document.client_id == client_id).scalar() or 0
    docs_done = (
        db.query(func.count(Document.id))
        .filter(Document.client_id == client_id, Document.status == "done")
        .scalar()
        or 0
    )
    docs_failed = (
        db.query(func.count(Document.id))
        .filter(Document.client_id == client_id, Document.status == "failed")
        .scalar()
        or 0
    )
    subs = (
        db.query(Subscription)
        .options(joinedload(Subscription.plan))
        .filter(Subscription.client_id == client_id)
        .order_by(Subscription.id.desc())
        .limit(20)
        .all()
    )
    payments = (
        db.query(Payment)
        .filter(Payment.client_id == client_id)
        .order_by(Payment.id.desc())
        .limit(30)
        .all()
    )
    settings_blob = client.settings if isinstance(client.settings, dict) else {}
    webhook_url = (settings_blob.get("webhookUrl") or "").strip()
    return {
        "client": {
            "id": client.id,
            "name": client.name,
            "company_name": client.company_name,
            "email": client.email,
            "api_key": client.api_key,
        },
        "documents": {"total": int(docs_total), "completed": int(docs_done), "failed": int(docs_failed)},
        "subscriptions": [
            {
                "id": s.id,
                "plan_name": s.plan.name if s.plan else None,
                "status": s.status,
                "start_date": s.start_date.isoformat() if s.start_date else None,
                "end_date": s.end_date.isoformat() if s.end_date else None,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in subs
        ],
        "payments": [
            {
                "id": p.id,
                "status": p.status,
                "subscription_id": p.subscription_id,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in payments
        ],
        "webhook": {"configured": bool(webhook_url), "url_hint": webhook_url[:48] + "…" if len(webhook_url) > 48 else webhook_url or None},
    }


@router.get("/template-health", response_model=list[dict[str, Any]])
def template_health(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    tpls = db.query(Template).order_by(Template.id.desc()).limit(80).all()
    out: list[dict[str, Any]] = []
    for t in tpls:
        total = (
            db.query(func.count(Document.id))
            .filter(Document.template_id == t.id, Document.created_at >= week_ago)
            .scalar()
            or 0
        )
        failed = (
            db.query(func.count(Document.id))
            .filter(
                Document.template_id == t.id,
                Document.created_at >= week_ago,
                Document.status == "failed",
            )
            .scalar()
            or 0
        )
        rate = round(100.0 * failed / max(1, int(total)), 1) if total else 0.0
        out.append(
            {
                "id": t.id,
                "name": t.name,
                "template_key": t.template_key,
                "status": t.status,
                "documents_7d": int(total),
                "failures_7d": int(failed),
                "failure_rate_percent": rate,
                "updated_at": t.updated_at.isoformat() if getattr(t, "updated_at", None) else None,
            }
        )
    return out


@router.get("/pipeline-diagnostics", response_model=list[dict[str, Any]])
def pipeline_diagnostics(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
    limit: int = Query(40, ge=1, le=200),
):
    since = datetime.now(timezone.utc) - timedelta(days=30)
    rows = (
        db.query(Document)
        .options(joinedload(Document.client), joinedload(Document.template))
        .filter(Document.status == "failed", Document.created_at >= since)
        .order_by(Document.id.desc())
        .limit(limit)
        .all()
    )
    out = []
    for d in rows:
        out.append(
            {
                "document_id": d.id,
                "client_id": d.client_id,
                "client_name": (d.client.name if d.client else None),
                "template_id": d.template_id,
                "template_name": (d.template.name if d.template else None),
                "status": d.status,
                "created_at": d.created_at.isoformat() if d.created_at else None,
                "processed_at": d.processed_at.isoformat() if d.processed_at else None,
                "hint": "See API logs around process time for stack traces; document row has no error column yet.",
            }
        )
    return out


@router.get("/payments-reconciliation", response_model=list[PaymentReconciliationOut])
def payments_reconciliation(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
    limit: int = Query(200, ge=1, le=500),
):
    rows = (
        db.query(Payment)
        .options(joinedload(Payment.client))
        .order_by(Payment.id.desc())
        .limit(limit)
        .all()
    )
    return [
        PaymentReconciliationOut(
            id=p.id,
            client_id=p.client_id,
            client_name=p.client.name if p.client else None,
            subscription_id=p.subscription_id,
            status=p.status,
            created_at=p.created_at,
        )
        for p in rows
    ]


@router.get("/webhooks-summary", response_model=list[WebhookTenantOut])
def webhooks_summary(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
    limit: int = Query(80, ge=1, le=200),
):
    clients = db.query(Client).order_by(Client.id.asc()).limit(limit).all()
    out: list[WebhookTenantOut] = []
    for c in clients:
        raw = c.settings if isinstance(c.settings, dict) else {}
        url = (raw.get("webhookUrl") or "").strip()
        out.append(
            WebhookTenantOut(
                client_id=c.id,
                client_name=c.name or c.company_name or f"Client {c.id}",
                webhook_configured=bool(url),
            )
        )
    return out


@router.get("/export/clients.csv")
def export_clients_csv(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    clients = db.query(Client).order_by(Client.id.asc()).all()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["id", "name", "company_name", "email", "has_api_key", "created_at"])
    for c in clients:
        w.writerow(
            [
                c.id,
                c.name or "",
                c.company_name or "",
                c.email or "",
                "yes" if (c.api_key or "").strip() else "no",
                c.created_at.isoformat() if c.created_at else "",
            ]
        )
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="clients_export.csv"'},
    )


@router.get("/onboarding-checklist", response_model=OnboardingChecklistOut)
def onboarding_checklist(
    db: Session = Depends(get_db),
    _super: User = Depends(require_superadmin),
):
    mon = build_monitoring_status(db)
    pg = next((c for c in mon["checks"] if c["id"] == "postgres"), {"ok": False})
    oa = next((c for c in mon["checks"] if c["id"] == "openai"), {"ok": False})
    vi = next((c for c in mon["checks"] if c["id"] == "vision"), {"ok": False})
    has_clients = (db.query(func.count(Client.id)).scalar() or 0) > 0
    has_tpl = (
        db.query(func.count(Template.id))
        .filter(or_(Template.status.is_(None), func.lower(Template.status) == "active"))
        .scalar()
        or 0
    ) > 0
    items = [
        {"id": "db", "label": "Database reachable", "done": bool(pg.get("ok"))},
        {"id": "openai", "label": "OpenAI API key configured", "done": bool(oa.get("ok"))},
        {"id": "vision", "label": "Google Vision credentials file", "done": bool(vi.get("ok"))},
        {"id": "client", "label": "At least one client tenant", "done": has_clients},
        {"id": "template", "label": "At least one active template", "done": has_tpl},
        {
            "id": "runbook",
            "label": "Review backend/README.md (OCR, env, template builder)",
            "done": False,
        },
    ]
    return OnboardingChecklistOut(
        postgres_ok=bool(pg.get("ok")),
        openai_configured=bool(oa.get("ok")),
        vision_configured=bool(vi.get("ok")),
        has_clients=has_clients,
        has_active_template=has_tpl,
        items=items,
    )
