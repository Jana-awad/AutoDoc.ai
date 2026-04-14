from datetime import datetime

from pydantic import BaseModel


class UserDashboardKpisOut(BaseModel):
    total_documents_processed: int
    successful_requests: int
    failed_requests: int
    average_processing_time_seconds: float


class UserLogListItemOut(BaseModel):
    id: int
    template_id: int | None
    document_id: int
    timestamp: datetime
    status: str


class UserLogListOut(BaseModel):
    items: list[UserLogListItemOut]
