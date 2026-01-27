from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AutoDoc AI"

    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:password@localhost:5432/autodoc"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
