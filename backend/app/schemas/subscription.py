from datetime import datetime
from pydantic import BaseModel

class SubscriptionCreate(BaseModel):
    client_id: int
    plan_id: int

class SubscriptionOut(BaseModel):
    id: int
    client_id: int
    plan_id: int
    status: str
    start_date: datetime | None = None
    end_date: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True
