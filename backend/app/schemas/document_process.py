from pydantic import BaseModel
from app.schemas.document import DocumentOut

class DocumentProcessOut(BaseModel):
    document: DocumentOut
    task_id: str | None = None
    status: str = "processing"
    extractions_created: int | None = None  # Only available after task completes

    class Config:
        from_attributes = True
