from datetime import datetime
from typing import Literal

from beanie import Document, PydanticObjectId
from pydantic import BaseModel

from app.models.base import DOCUMENT_CONFIG as CAMEL


class Image(BaseModel):
    model_config = CAMEL
    url: str
    public_id: str


class Ingredient(BaseModel):
    model_config = CAMEL
    name: str
    quantity: float | None = None
    unit: str | None = None
    note: str | None = None


class Step(BaseModel):
    model_config = CAMEL
    text: str
    duration_min: int | None = None
    tip: str | None = None


class Section(BaseModel):
    model_config = CAMEL
    section: str | None = None
    steps: list[Step]


class Recipe(Document):
    """Embedded items are plain models, so they get no _id (matches Mongoose `_id: false`)."""

    model_config = CAMEL

    title: str
    description: str | None = None
    dish_name: str
    author: PydanticObjectId  # a plain ObjectId reference, not a Beanie Link, so queries match Express
    food_type: Literal["veg", "nonveg"]
    category: str
    difficulty: Literal["easy", "medium", "hard"]
    servings: int
    prep_time_min: int
    cook_time_min: int
    images: list[Image]
    ingredients: list[Ingredient]
    instructions: list[Section]
    avg_rating: float = 0
    review_count: int = 0
    like_count: int = 0
    # No defaults: the service sets both from one clock reading, so a new recipe has createdAt == updatedAt.
    created_at: datetime
    updated_at: datetime

    class Settings:
        name = "recipes"
