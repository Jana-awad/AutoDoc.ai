from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.client import ClientOut
from app.schemas.user import UserOut


class SignupRequest(BaseModel):
    organization_name: str
    company_name: str | None = None
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    client_type: Literal["business", "enterprise"]


class SignupResponse(BaseModel):
    client: ClientOut
    user: UserOut

    class Config:
        from_attributes = True
