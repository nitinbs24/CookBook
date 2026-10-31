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


settings = Settings()
