"""Response models for GET /super/ai-overview (super-admin integration & usage snapshot)."""

from pydantic import BaseModel, Field


class OpenAIIntegrationOut(BaseModel):
    configured: bool = Field(description="True when OPENAI_API_KEY is set to a non-placeholder value")
    key_hint: str | None = Field(None, description="Last 4 chars of key, masked, or null when not configured")
    default_model: str


class OcrIntegrationOut(BaseModel):
    engine: str = Field(default="google_cloud_vision")
    service_account_env_set: bool
    service_account_file_exists: bool
    quota_project_id: str | None
    pdf_ocr_dpi: int
    pdf_embedded_min_chars_skip_ocr: int
    max_image_edge_px: int


class TenantApiSurfaceOut(BaseModel):
    total_clients: int
    clients_with_programmatic_api_key: int
    clients_with_webhook_url: int


class EndpointHitOut(BaseModel):
    endpoint: str
    count: int


class UsageSnapshotOut(BaseModel):
    api_requests_logged_24h: int
    api_requests_logged_7d: int
    http_2xx_7d: int
    http_4xx_7d: int
    http_5xx_7d: int
    documents_created_7d: int
    documents_completed_7d: int
    extractions_created_7d: int
    top_endpoints_7d: list[EndpointHitOut]


class SuperAiOverviewOut(BaseModel):
    openai: OpenAIIntegrationOut
    ocr: OcrIntegrationOut
    tenants: TenantApiSurfaceOut
    usage: UsageSnapshotOut
