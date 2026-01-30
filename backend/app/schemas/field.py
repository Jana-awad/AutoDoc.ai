from pydantic import BaseModel

class FieldCreate(BaseModel):
    template_id: int
    name: str
    field_type: str | None = None
    required: bool = False

class FieldOut(FieldCreate):
    id: int
    class Config:
        from_attributes = True
