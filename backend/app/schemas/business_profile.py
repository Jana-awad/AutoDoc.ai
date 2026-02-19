from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


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


class BusinessAccountInfo(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    company: str | None = None
    phone: str | None = None
    address: str | None = None
    website: str | None = None
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
