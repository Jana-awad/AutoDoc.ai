from pydantic import BaseModel

class TemplateBase(BaseModel):
    name: str
    description: str | None = None
    client_id: int | None = None
    is_global: bool = False

class TemplateCreate(TemplateBase):
    pass

class TemplateOut(TemplateBase):
    id: int
    class Config:
        from_attributes = True
