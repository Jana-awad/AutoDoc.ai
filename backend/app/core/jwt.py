from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings


def create_access_token(
    subject: str,
    role: str | None = None,
    client_id: int | None = None,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": subject,
        "exp": expire,
    }

    if role is not None:
        payload["role"] = role

    if client_id is not None:
        payload["client_id"] = client_id

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
