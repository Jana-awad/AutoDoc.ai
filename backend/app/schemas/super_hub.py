from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class PlatformConfigOut(BaseModel):
    document_processing_enabled: bool
    uploads_paused: bool
    incident_title: str | None
    incident_body: str | None
    slo_target_percent: float | None
    default_rate_limit_per_minute: int | None
    allowed_llm_models: list[str] | None = None
    blocked_prompt_substrings: list[str] | None = None
    updated_at: datetime | None = None
    updated_by_user_id: int | None = None

    class Config:
        from_attributes = True


class PlatformConfigPatch(BaseModel):
    document_processing_enabled: bool | None = None
    uploads_paused: bool | None = None
    incident_title: str | None = None
    incident_body: str | None = None
    slo_target_percent: float | None = None
    default_rate_limit_per_minute: int | None = None
    allowed_llm_models: list[str] | None = None
    blocked_prompt_substrings: list[str] | None = None


class SuperDashboardBundleOut(BaseModel):
    keyMetrics: dict[str, Any]
    topClients: list[dict[str, Any]]
    recentActivity: list[dict[str, Any]]
    systemHealth: dict[str, Any]
    aiAnalytics: dict[str, Any]
    templateIntelligence: dict[str, Any]
    liveApiUsage: dict[str, Any]
    auditLog: list[dict[str, Any]]
    supportSLA: dict[str, Any]
    securityAccess: dict[str, Any]


class HealthCheckOut(BaseModel):
    id: str
    label: str
    ok: bool
    detail: str


class MonitoringStatusOut(BaseModel):
    checks: list[HealthCheckOut]
    platform: dict[str, Any]


class ActivityItemOut(BaseModel):
    id: str
    type: str
    message: str
    timestamp: str | None = None
    client_id: int | None = None


class PaymentReconciliationOut(BaseModel):
    id: int
    client_id: int
    client_name: str | None
    subscription_id: int
    status: str
    created_at: datetime | None = None


class WebhookTenantOut(BaseModel):
    client_id: int
    client_name: str
    webhook_configured: bool


class OnboardingChecklistOut(BaseModel):
    postgres_ok: bool
    openai_configured: bool
    vision_configured: bool
    has_clients: bool
    has_active_template: bool
    items: list[dict[str, Any]]
