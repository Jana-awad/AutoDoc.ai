from pydantic import BaseModel
from datetime import datetime

class ExtractionCreate(BaseModel):
    document_id: int
    field_id: int | None = None
    value_text: str | None = None
    value_json: dict | None = None
    confidence: float | None = None

class ExtractionUpdate(BaseModel):
    value_text: str | None = None
    value_json: dict | None = None
    confidence: float | None = None

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
