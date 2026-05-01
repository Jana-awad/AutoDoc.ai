from pydantic import BaseModel

class PlanCreate(BaseModel):
    name: str
    monthly_price: int = 0
    max_users: int = 1
    allow_creation: bool = True
    can_manage_templates: bool = False
    is_active: bool = True

class PlanUpdate(BaseModel):
    name: str | None = None
    monthly_price: int | None = None
    max_users: int | None = None
    allow_creation: bool | None = None
    can_manage_templates: bool | None = None
    is_active: bool | None = None


class PlanOut(BaseModel):
    id: int
    name: str
    monthly_price: int
    max_users: int
    allow_creation: bool
    can_manage_templates: bool
    is_active: bool

    class Config:
        from_attributes = True
