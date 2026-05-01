from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Backend root (folder containing alembic.ini). Keeps DATABASE_URL consistent for uvicorn,
# Celery, and Alembic even when the shell cwd is not the backend directory.
_BACKEND_ROOT = Path(__file__).resolve().parents[2]

# So GOOGLE_APPLICATION_CREDENTIALS and other vars in .env reach os.environ (e.g. Google client libs).
load_dotenv(_BACKEND_ROOT / ".env", override=False)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "AutoDoc AI"

    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://postgres:password@localhost:5432/autodoc"
    )
    UPLOAD_DIR: str = "uploads"  
    SECRET_KEY: str = Field(default="CHANGE_ME")   #  real value in .env
    ALGORITHM: str = "HS256" #HMAC and Sha256 used for jwt token (symmetric w fast w simple)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0")  # Memurai/Redis compatible
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0")  # Memurai/Redis compatible
    # OCR: Google Cloud Vision only (pip install -r requirements-google-vision.txt).
    PDF_OCR_DPI: int = Field(default=300)
    PDF_EMBEDDED_MIN_CHARS_TO_SKIP_OCR: int = Field(default=40)
    GOOGLE_VISION_QUOTA_PROJECT_ID: str | None = Field(default=None)
    OPENAI_API_KEY: str = Field(default="default_key")  # put real value in .env
    OPENAI_MODEL: str = Field(default="gpt-5-nano")  # Free-tier friendly; or gpt-4o-mini, gpt-4o


settings = Settings()
