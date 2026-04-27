from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AutoDoc AI"

    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:password@localhost:5432/autodoc"
    )
    UPLOAD_DIR: str = "uploads"  
    SECRET_KEY: str = Field(default="CHANGE_ME")   #  real value in .env
    ALGORITHM: str = "HS256" #HMAC and Sha256 used for jwt token (symmetric w fast w simple)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
