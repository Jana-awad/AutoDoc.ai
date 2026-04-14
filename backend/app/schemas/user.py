from pydantic import BaseModel, EmailStr, Field
from app.core.enums import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: str | None = None
    role: UserRole = UserRole.USER
    client_id: int | None = None

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True


class UserProfileOut(UserOut):
    company_name: str | None = None


class ChangePasswordRequest(BaseModel):
    """Current and new password for secure password change."""
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=72)
