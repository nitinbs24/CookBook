from datetime import UTC, datetime

from beanie import Document, PydanticObjectId
from pydantic import Field

from app.models.base import DOCUMENT_CONFIG


class Review(Document):
    model_config = DOCUMENT_CONFIG

    recipe: PydanticObjectId
    user: PydanticObjectId
    rating: int
    comment: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    class Settings:
        name = "reviews"
