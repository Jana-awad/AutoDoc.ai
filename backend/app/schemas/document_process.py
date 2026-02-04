from pydantic import BaseModel
from app.schemas.document import DocumentOut

class DocumentProcessOut(BaseModel):
    document: DocumentOut
    extractions_created: int

    class Config:
        from_attributes = True
