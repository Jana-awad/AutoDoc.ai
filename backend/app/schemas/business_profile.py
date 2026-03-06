from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class ChangePasswordRequest(BaseModel):
    """Current and new password for secure password change."""
    current_password: str = Field(min_length=1, description="Current password for verification")
    new_password: str = Field(min_length=8, max_length=72, description="New password (8-72 chars)")


class BusinessAccountUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    company: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
    country: str | None = None
    industry: str | None = None


class BusinessProfileSummary(BaseModel):
    """Profile summary for dashboard header (name, plan)."""
    name: str | None = None
    fullName: str | None = None
    email: str | None = None
    plan: str | None = None


class BusinessAccountInfo(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    company: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
    country: str | None = None
    industry: str | None = None
    planName: str | None = None
    planId: int | None = None
    totalUsers: int | None = None
    docsProcessed: int | None = None
    apiCalls: int | None = None


class BusinessUserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str | None = None
    password: str | None = None


class BusinessUserUpdate(BaseModel):
    role: str | None = None
    status: str | None = None


class BusinessUserOut(BaseModel):
    id: int
    name: str | None = None
    email: EmailStr
    role: str
    status: str
    joinedAt: datetime | None = None


class BusinessPlanChange(BaseModel):
    planId: int


class BusinessBillingPlan(BaseModel):
    id: int | None = None
    name: str | None = None
    description: str | None = None
    price: float | None = None
    currency: str | None = None
    interval: str | None = None
    isCurrent: bool | None = None


class BusinessPaymentMethod(BaseModel):
    brand: str | None = None
    last4: str | None = None
    expiry: str | None = None


class BusinessBillingOut(BaseModel):
    planName: str | None = None
    planId: int | None = None
    price: float | None = None
    currency: str | None = None
    billingCycle: str | None = None
    status: str | None = None
    documentsUsed: int | None = None
    documentsLimit: int | None = None
    apiCallsUsed: int | None = None
    nextBillingDate: datetime | None = None
    paymentMethod: BusinessPaymentMethod | None = None
    availablePlans: list[BusinessBillingPlan] | None = None


class BusinessInvoiceOut(BaseModel):
    id: int | None = None
    number: str | None = None
    date: datetime | None = None
    amount: float | None = None
    currency: str | None = None
    status: str | None = None
    downloadUrl: str | None = None


class BusinessBillingHistoryOut(BaseModel):
    id: str | None = None
    type: str | None = None
    description: str | None = None
    date: datetime | None = None
    amount: float | None = None
    currency: str | None = None
    status: str | None = None


class BusinessSettingsOut(BaseModel):
    """Business workspace/settings returned to frontend (camelCase)."""
    workspaceName: str | None = None
    timezone: str | None = None
    twoFactorEnabled: bool | None = None
    sessionTimeout: int | str | None = None
    apiRateLimit: int | str | None = None
    webhookUrl: str | None = None
    emailNotifications: bool | None = None
    activityAlerts: bool | None = None
    billingAlerts: bool | None = None
    securityAlerts: bool | None = None

    class Config:
        from_attributes = True
        populate_by_name = True


class BusinessSettingsUpdate(BaseModel):
    """Update payload for business settings (all optional)."""
    workspaceName: str | None = None
    timezone: str | None = None
    twoFactorEnabled: bool | None = None
    sessionTimeout: int | None = Field(None, ge=5, le=120)
    apiRateLimit: int | None = Field(None, ge=0)
    webhookUrl: str | None = None
    emailNotifications: bool | None = None
    activityAlerts: bool | None = None
    billingAlerts: bool | None = None
    securityAlerts: bool | None = None

    @field_validator("sessionTimeout", "apiRateLimit", mode="before")
    @classmethod
    def coerce_int(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, int):
            return v
        try:
            return int(v)
        except (TypeError, ValueError):
            return None
