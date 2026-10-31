from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# One .env at the repo root serves both backends; real environment variables win over it.
ROOT_ENV = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_ENV, extra="ignore")

    mongodb_uri: str
    jwt_secret: str = Field(min_length=32)
    cors_origin: str
    cloudinary_fake: bool = False  # 1 = fake uploads, no network (ADR-0005); the contract tests set it
    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None


settings = Settings()
