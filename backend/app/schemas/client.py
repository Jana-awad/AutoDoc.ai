from datetime import datetime

from pydantic import BaseModel


class ClientBase(BaseModel):
    name: str
    company_name: str | None = None
    email: str | None = None


class ClientCreate(ClientBase):
    """Optional: create an initial admin user for the client with this password."""
    password: str | None = None
    """Optional: assign the client to this plan (creates an active subscription)."""
    plan_id: int | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    company_name: str | None = None
    email: str | None = None


class ClientOut(ClientBase):
    id: int
    api_key: str | None = None

    class Config:
        from_attributes = True


class ClientUserOut(BaseModel):
    id: int
    name: str | None
    email: str
    role: str
    status: str

    class Config:
        from_attributes = True


class ClientListOut(BaseModel):
    id: int
    name: str
    company_name: str | None
    email: str | None
    subscription_plan: str | None
    subscription_status: str | None
    subscription_end_date: datetime | None
    user_count: int
    api_calls_this_month: int
    plan_id: int | None

    class Config:
        from_attributes = True


class ClientStatsOut(BaseModel):
    total_clients: int
    active_subscriptions: int
    monthly_recurring_revenue_cents: int
    business_accounts: int
    enterprise_accounts: int


class ClientDetailsOut(BaseModel):
    id: int
    name: str
    company_name: str | None
    email: str | None
    api_key: str | None
    industry: str | None
    country: str | None
    subscription_id: int | None
    plan_id: int | None
    plan_name: str | None
    subscription_status: str | None
    billing_cycle: str | None
    renewal_date: datetime | None
    payment_status: str | None
    api_calls_this_month: int
    api_quota: int | None
    daily_average_api_calls: float | None
    users: list[ClientUserOut]

    class Config:
        from_attributes = True
