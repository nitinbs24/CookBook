from datetime import UTC, datetime
from typing import Literal

from beanie import Document
from pydantic import Field

from app.models.base import DOCUMENT_CONFIG


class User(Document):
    model_config = DOCUMENT_CONFIG

    name: str
    email: str
    password_hash: str
    role: Literal["user", "admin"] = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "users"
