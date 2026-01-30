from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    username: str | None = None
    role: str = "user"
    client_id: int | None = None

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True
