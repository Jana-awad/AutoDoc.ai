"""Business dashboard API: metrics, top users, activity, health, etc."""

from datetime import datetime, timedelta, timezone
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.api.deps import require_business_admin
from app.models.api_log import ApiLog
from app.models.document import Document
from app.models.template import Template
from app.models.user import User
from app.crud.crud_subscription import get_active_subscription
from app.schemas.business_dashboard import (
    DashboardMetricsResponse,
    DashboardMetricItem,
    DashboardTopUsersResponse,
    DashboardTopUser,
    DashboardActivityResponse,
    DashboardActivityItem,
    DashboardSystemHealthResponse,
    DashboardAiAnalyticsResponse,
    DashboardTemplateIntelligenceResponse,
    DashboardTemplateUpdateItem,
    DashboardApiUsageResponse,
    DashboardPlanUsage,
    DashboardAuditResponse,
    DashboardAuditEntry,
    DashboardSupportSlaResponse,
    DashboardSecurityOverviewResponse,
    DashboardRoleCount,
    DashboardSecurityAlert,
)

router = APIRouter(prefix="/v1/business/dashboard", tags=["business-dashboard"])


def _client_filter(db: Session, current_user: User):
    return current_user.client_id


@router.get("/metrics", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Aggregate metrics for the business dashboard (documents, success rate, API calls, users)."""
    cid = _client_filter(db, current_user)
    if not cid:
        return DashboardMetricsResponse(metrics=[])

    total_docs = db.query(Document).filter(Document.client_id == cid).count()
    done_docs = (
        db.query(Document)
        .filter(Document.client_id == cid, Document.status == "done")
        .count()
    )
    success_rate = (done_docs / total_docs * 100) if total_docs else 0

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    api_calls_today = (
        db.query(ApiLog).filter(ApiLog.client_id == cid, ApiLog.created_at >= today_start).count()
    )

    active_users = db.query(User).filter(User.client_id == cid, User.is_active).count()

    month_start = datetime.now(timezone.utc) - timedelta(days=30)
    api_calls_month = (
        db.query(ApiLog).filter(ApiLog.client_id == cid, ApiLog.created_at >= month_start).count()
    )
    remaining_quota = max(0, 10000 - api_calls_month) if api_calls_month else 10000

    metrics = [
        DashboardMetricItem(label="Total Documents", value=total_docs, trend="neutral"),
        DashboardMetricItem(label="Success Rate", value=round(success_rate, 1), changePercent=round(success_rate, 1), trend="neutral", format="percent"),
        DashboardMetricItem(label="API Calls Today", value=api_calls_today, trend="neutral"),
        DashboardMetricItem(label="Active Users", value=active_users, trend="neutral"),
        DashboardMetricItem(label="Remaining Quota", value=remaining_quota, trend="neutral"),
    ]
    return DashboardMetricsResponse(
        metrics=metrics,
        totalDocuments=total_docs,
        successRate=round(success_rate, 1),
        apiCallsToday=api_calls_today,
        activeUsers=active_users,
        remainingQuota=remaining_quota,
    )


@router.get("/top-users", response_model=DashboardTopUsersResponse)
def get_top_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Top users in the client (by order; per-user doc/API counts not tracked yet)."""
    cid = _client_filter(db, current_user)
    if not cid:
        return DashboardTopUsersResponse(users=[])

    users = (
        db.query(User)
        .filter(User.client_id == cid)
        .order_by(User.created_at.desc())
        .all()
    )
    out = []
    for i, u in enumerate(users):
        out.append(
            DashboardTopUser(
                id=u.id,
                name=u.username,
                email=u.email,
                rank=i + 1,
                documentsProcessed=0,
                apiCalls=0,
                errorCount=0,
            )
        )
    return DashboardTopUsersResponse(users=out)


@router.get("/activity", response_model=DashboardActivityResponse)
def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
    limit: int = Query(8, ge=1, le=50),
):
    """Recent activity from documents and API logs."""
    cid = _client_filter(db, current_user)
    if not cid:
        return DashboardActivityResponse(items=[])

    items = []
    # Recent documents
    docs = (
        db.query(Document)
        .filter(Document.client_id == cid)
        .order_by(Document.created_at.desc())
        .limit(limit)
        .all()
    )
    for d in docs:
        status = "success" if d.status == "done" else ("error" if d.status == "failed" else "warning")
        ts = d.created_at.isoformat() if d.created_at else ""
        items.append(
            DashboardActivityItem(
                id=f"doc_{d.id}",
                title=f"Document {d.status}",
                status=status,
                actor="System",
                timestamp=ts,
                category="Document",
            )
        )

    # Recent API calls (if we want to mix; keep simple with docs only if enough)
    if len(items) < limit:
        logs = (
            db.query(ApiLog)
            .filter(ApiLog.client_id == cid)
            .order_by(ApiLog.created_at.desc())
            .limit(limit - len(items))
            .all()
        )
        for log in logs:
            status = "success" if log.status_code and 200 <= log.status_code < 300 else "error"
            ts = log.created_at.isoformat() if log.created_at else ""
            items.append(
                DashboardActivityItem(
                    id=f"api_{log.id}",
                    title=log.endpoint or "API request",
                    status=status,
                    actor="API",
                    timestamp=ts,
                    category="API",
                )
            )

    items.sort(key=lambda x: x.timestamp or "", reverse=True)
    return DashboardActivityResponse(items=items[:limit])


@router.get("/system-health", response_model=DashboardSystemHealthResponse)
def get_system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """System health placeholder (operational by default)."""
    return DashboardSystemHealthResponse(
        apiStatus="operational",
        errorSpikeStatus="none",
        avgProcessingTime="1.2s",
        uptime=99.9,
        performanceTrend="operational",
        lastIncident="None",
    )


@router.get("/ai-analytics", response_model=DashboardAiAnalyticsResponse)
def get_ai_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """AI processing analytics (derived from documents where possible)."""
    cid = _client_filter(db, current_user)
    total = db.query(Document).filter(Document.client_id == cid).count()
    done = (
        db.query(Document)
        .filter(Document.client_id == cid, Document.status == "done")
        .count()
    )
    accuracy = (done / total * 100) if total else 0
    return DashboardAiAnalyticsResponse(
        ocrAccuracy=round(accuracy, 1),
        extractionConfidence=round(accuracy, 1),
        templatePerformance=round(accuracy, 1),
        processingLatency=1.2,
        trend="stable",
    )


@router.get("/template-intelligence", response_model=DashboardTemplateIntelligenceResponse)
def get_template_intelligence(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Template counts and recent updates."""
    cid = _client_filter(db, current_user)
    # Client templates + global
    base = db.query(Template).filter(
        (Template.client_id == cid) | (Template.is_global == True)
    )
    active = base.count()
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    updated_week = (
        db.query(Template)
        .filter(
            ((Template.client_id == cid) | (Template.is_global == True)),
            Template.created_at >= week_ago,
        )
        .count()
    )
    recent = (
        db.query(Template)
        .filter((Template.client_id == cid) | (Template.is_global == True))
        .order_by(Template.created_at.desc())
        .limit(5)
        .all()
    )
    recent_updates = [
        DashboardTemplateUpdateItem(
            id=t.id,
            name=t.name,
            status="active",
            updatedAt=t.created_at.isoformat() if t.created_at else None,
        )
        for t in recent
    ]
    return DashboardTemplateIntelligenceResponse(
        activeTemplates=active,
        templatesInTraining=0,
        failedTemplates=0,
        updatedThisWeek=updated_week,
        recentUpdates=recent_updates,
    )


@router.get("/api-usage", response_model=DashboardApiUsageResponse)
def get_api_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """API usage and success/error rates."""
    cid = _client_filter(db, current_user)
    month_start = datetime.now(timezone.utc) - timedelta(days=30)
    logs = (
        db.query(ApiLog)
        .filter(ApiLog.client_id == cid, ApiLog.created_at >= month_start)
        .all()
    )
    total = len(logs)
    success = sum(1 for l in logs if l.status_code and 200 <= l.status_code < 300)
    success_rate = (success / total * 100) if total else 0
    error_rate = 100 - success_rate if total else 0
    return DashboardApiUsageResponse(
        requestsPerMinute=min(total // 30, 100),
        successRate=round(success_rate, 1),
        errorRate=round(error_rate, 1),
        throttlingStatus="none",
        planUsage=DashboardPlanUsage(
            used=total,
            current=total,
            limit=10000,
            total=10000,
        ),
    )


@router.get("/audit-log", response_model=DashboardAuditResponse)
def get_audit_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Audit-style entries from recent API and document activity."""
    cid = _client_filter(db, current_user)
    entries = []
    docs = (
        db.query(Document)
        .filter(Document.client_id == cid)
        .order_by(Document.created_at.desc())
        .limit(20)
        .all()
    )
    for d in docs:
        ts = d.created_at.isoformat() if d.created_at else ""
        entries.append(
            DashboardAuditEntry(
                id=f"doc_{d.id}",
                action="document_processed",
                timestamp=ts,
                details=f"Document {d.status}",
                actor="System",
            )
        )
    logs = (
        db.query(ApiLog)
        .filter(ApiLog.client_id == cid)
        .order_by(ApiLog.created_at.desc())
        .limit(10)
        .all()
    )
    for log in logs:
        ts = log.created_at.isoformat() if log.created_at else ""
        entries.append(
            DashboardAuditEntry(
                id=log.id,
                action="api_call",
                timestamp=ts,
                details=log.endpoint or "API request",
                actor="API",
            )
        )
    entries.sort(key=lambda e: e.timestamp or "", reverse=True)
    return DashboardAuditResponse(entries=entries[:30])


@router.get("/support-sla", response_model=DashboardSupportSlaResponse)
def get_support_sla(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Support and SLA placeholder."""
    return DashboardSupportSlaResponse(
        supportLabel="Business Support",
        slaStatus="Standard",
        responseTime="24h",
        openTickets=0,
        resolvedTickets=0,
        contactEmail="support@autodoc.example",
        ticketsUrl=None,
    )


@router.get("/security-overview", response_model=DashboardSecurityOverviewResponse)
def get_security_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_business_admin),
):
    """Security overview: sessions, roles, alerts."""
    cid = _client_filter(db, current_user)
    users = db.query(User).filter(User.client_id == cid).all()
    role_counts = defaultdict(int)
    for u in users:
        r = (u.role.value if hasattr(u.role, "value") else str(u.role)).strip().lower().replace(" ", "_")
        if r == "business_client_admin":
            r = "business_admin"
        role_counts[r] += 1
    distribution = [DashboardRoleCount(role=k, count=v) for k, v in role_counts.items()]
    return DashboardSecurityOverviewResponse(
        activeSessions=len(users),
        mfaAdoption=0,
        roleDistribution=distribution,
        alerts=[],
    )
