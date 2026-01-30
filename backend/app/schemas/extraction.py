from pydantic import BaseModel
from datetime import datetime

class ExtractionOut(BaseModel):
    id: int
    document_id: int
    field_id: int | None = None
    value_text: str | None = None
    value_json: dict | None = None
    confidence: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True
