from pydantic import BaseModel

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
