from typing import Annotated, Literal

from pydantic import BeforeValidator, Field, StringConstraints

from app.schemas.common import CamelModel, IsoDatetime


def Text(min_length: int = 0, max_length: int | None = None):  # noqa: N802 - reads like a type
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)]


def Int(ge: int, le: int):  # noqa: N802
    # strict: "2" and 2.5 are rejected, like zod's z.number().int() in Express
    return Annotated[int, Field(strict=True, ge=ge, le=le)]


# Trimmed with single inner spaces, so the case-insensitive dish filter matches exactly.
DishName = Annotated[str, BeforeValidator(lambda v: " ".join(v.split()) if isinstance(v, str) else v), StringConstraints(min_length=2, max_length=80)]


class ImageIn(CamelModel):
    url: Annotated[str, StringConstraints(pattern=r"^https://\S+$", max_length=500)]
    # Must be in our folder: deleting a recipe destroys its images by publicId (Phase 9).
    public_id: Annotated[str, StringConstraints(pattern=r"^recipebook/[\w-]+$", max_length=300)]


class IngredientIn(CamelModel):
    name: Text(1, 60)
    quantity: Annotated[float, Field(ge=0, strict=True)] | None = None  # strict: "1.5" is rejected, like zod
    unit: Text(max_length=20) | None = None
    note: Text(max_length=60) | None = None


class StepIn(CamelModel):
    text: Text(3, 600)
    duration_min: Int(0, 1440) | None = None
    tip: Text(max_length=200) | None = None


class SectionIn(CamelModel):
    section: Text(max_length=40) | None = None
    steps: Annotated[list[StepIn], Field(min_length=1, max_length=30)]


class RecipeIn(CamelModel):
    """POST/PUT /recipes body (TRD §9). Server-set fields (author, counters, timestamps) are ignored."""

    title: Text(3, 120)
    description: Text(max_length=500) | None = None
    dish_name: DishName
    food_type: Literal["veg", "nonveg"]
    category: Text(1)
    difficulty: Literal["easy", "medium", "hard"]
    servings: Int(1, 50)
    prep_time_min: Int(0, 1440)
    cook_time_min: Int(0, 1440)
    images: Annotated[list[ImageIn], Field(min_length=1, max_length=3)]
    ingredients: Annotated[list[IngredientIn], Field(min_length=1, max_length=40)]
    instructions: Annotated[list[SectionIn], Field(min_length=1, max_length=8)]


class AuthorOut(CamelModel):
    id: str
    name: str | None


class ImageOut(CamelModel):
    url: str
    public_id: str


class CardOut(CamelModel):
    """TRD §6.2 "Card": what every recipe list returns."""

    id: str
    title: str
    dish_name: str
    image: ImageOut
    food_type: str
    category: str
    avg_rating: float
    review_count: int
    like_count: int
    author: AuthorOut
    created_at: IsoDatetime


class TrendingCardOut(CardOut):
    week_likes: int


class IngredientOut(CamelModel):
    name: str
    quantity: float | None
    unit: str | None
    note: str | None


class StepOut(CamelModel):
    text: str
    duration_min: int | None
    tip: str | None


class SectionOut(CamelModel):
    section: str | None
    steps: list[StepOut]


class RecipeOut(CamelModel):
    id: str
    title: str
    description: str | None
    dish_name: str
    author: AuthorOut
    food_type: str
    category: str
    difficulty: str
    servings: int
    prep_time_min: int
    cook_time_min: int
    images: list[ImageOut]
    ingredients: list[IngredientOut]
    instructions: list[SectionOut]
    avg_rating: float
    review_count: int
    like_count: int
    created_at: IsoDatetime
    updated_at: IsoDatetime


class RecipeDetailOut(RecipeOut):
    liked_by_me: bool


