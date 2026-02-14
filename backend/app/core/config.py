from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "AutoDoc AI"

    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:password@localhost:5432/autodoc"
    )
    UPLOAD_DIR: str = "uploads"  
    SECRET_KEY: str = Field(default="CHANGE_ME")   # put real value in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")  # Memurai/Redis compatible
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0")  # Memurai/Redis compatible
    TESSERACT_CMD: str | None = Field(default=None)  # Optional: Tesseract executable path (e.g. r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    OPENAI_API_KEY: str = Field(default="default_key")  # put real value in .env
    OPENAI_MODEL: str = Field(default="gpt-5-nano")  # Free-tier friendly; or gpt-4o-mini, gpt-4o

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
