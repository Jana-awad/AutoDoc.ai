from datetime import datetime
from pydantic import BaseModel

class PaymentOut(BaseModel):
    id: int
    subscription_id: int
    client_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
