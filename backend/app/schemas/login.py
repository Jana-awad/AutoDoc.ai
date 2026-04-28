from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginBody(BaseModel):
    """Login payload: validated email + password (no silent type/coercion bugs)."""

    model_config = ConfigDict(extra="ignore")

    email: EmailStr
    password: str = Field(min_length=1, max_length=256)
