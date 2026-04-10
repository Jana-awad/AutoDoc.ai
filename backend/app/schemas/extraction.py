from datetime import datetime
from typing import Any

from pydantic import BaseModel
from pydantic import ConfigDict


class ExtractionCreate(BaseModel):
    document_id: int
    field_id: int | None = None
    value_text: str | None = None
    value_json: Any | None = None  # JSONB: string, number, dict, list, etc.
    confidence: float | None = None


class ExtractionUpdate(BaseModel):
    value_text: str | None = None
    value_json: Any | None = None
    confidence: float | None = None


class ExtractionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    field_id: int | None = None
    field_name: str | None = None
    field_label: str | None = None
    value_text: str | None = None
    value_json: Any | None = None
    confidence: float | None = None
    created_at: datetime
