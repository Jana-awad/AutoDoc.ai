from pydantic import BaseModel

class FieldCreate(BaseModel):
    template_id: int
    name: str
    label: str | None = None
    field_type: str | None = None
    required: bool = False
    description: str | None = None

class FieldOut(FieldCreate):
    id: int
    class Config:
        from_attributes = True
