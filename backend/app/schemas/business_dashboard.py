"""Schemas for business dashboard API (camelCase for frontend)."""

from datetime import datetime

from pydantic import BaseModel


class DashboardMetricItem(BaseModel):
    label: str | None = None
    value: int | float | str | None = None
    changePercent: float | None = None
    trend: str | None = None
    format: str | None = None


class DashboardMetricsResponse(BaseModel):
    metrics: list[DashboardMetricItem] | None = None
    totalDocuments: int | None = None
    successRate: float | None = None
    apiCallsToday: int | None = None
    activeUsers: int | None = None
    remainingQuota: int | None = None


class DashboardTopUser(BaseModel):
    id: int
    name: str | None = None
    email: str
    rank: int | None = None
    documentsProcessed: int | None = None
    apiCalls: int | None = None
    errorCount: int | None = None


class DashboardTopUsersResponse(BaseModel):
    users: list[DashboardTopUser]


class DashboardActivityItem(BaseModel):
    id: str
    title: str | None = None
    status: str | None = None
    actor: str | None = None
    timestamp: str | None = None
    category: str | None = None


class DashboardActivityResponse(BaseModel):
    items: list[DashboardActivityItem]


class DashboardSystemHealthResponse(BaseModel):
    apiStatus: str | None = None
    errorSpikeStatus: str | None = None
    avgProcessingTime: str | int | None = None
    uptime: float | str | None = None
    performanceTrend: str | None = None
    lastIncident: str | None = None


class DashboardAiAnalyticsResponse(BaseModel):
    ocrAccuracy: float | None = None
    extractionConfidence: float | None = None
    templatePerformance: float | None = None
    processingLatency: float | str | None = None
    trend: str | None = None


class DashboardTemplateUpdateItem(BaseModel):
    id: int | str | None = None
    name: str | None = None
    status: str | None = None
    updatedAt: str | None = None


class DashboardTemplateIntelligenceResponse(BaseModel):
    activeTemplates: int | None = None
    templatesInTraining: int | None = None
    failedTemplates: int | None = None
    updatedThisWeek: int | None = None
    recentUpdates: list[DashboardTemplateUpdateItem] | None = None


class DashboardPlanUsage(BaseModel):
    used: int | None = None
    current: int | None = None
    limit: int | None = None
    total: int | None = None


class DashboardApiUsageResponse(BaseModel):
    requestsPerMinute: int | None = None
    successRate: float | None = None
    errorRate: float | None = None
    throttlingStatus: str | None = None
    planUsage: DashboardPlanUsage | None = None


class DashboardAuditEntry(BaseModel):
    id: str | int | None = None
    action: str | None = None
    timestamp: str | None = None
    details: str | None = None
    actor: str | None = None


class DashboardAuditResponse(BaseModel):
    entries: list[DashboardAuditEntry]


class DashboardSupportSlaResponse(BaseModel):
    supportLabel: str | None = None
    slaStatus: str | None = None
    responseTime: str | None = None
    openTickets: int | None = None
    resolvedTickets: int | None = None
    contactEmail: str | None = None
    ticketsUrl: str | None = None


class DashboardRoleCount(BaseModel):
    role: str
    count: int


class DashboardSecurityAlert(BaseModel):
    id: str | int | None = None
    message: str | None = None


class DashboardSecurityOverviewResponse(BaseModel):
    activeSessions: int | str | None = None
    mfaAdoption: float | None = None
    roleDistribution: list[DashboardRoleCount] | None = None
    alerts: list[DashboardSecurityAlert] | None = None
