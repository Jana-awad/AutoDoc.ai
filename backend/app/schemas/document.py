from pydantic import BaseModel
from datetime import datetime

class DocumentOut(BaseModel):
    id: int
    client_id: int
    template_id: int | None = None
    file_url: str | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
