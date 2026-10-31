from typing import Annotated

from pydantic import Field, StringConstraints

from app.schemas.common import CamelModel, IsoDatetime
from app.schemas.recipe import AuthorOut


class ReviewIn(CamelModel):
    rating: Annotated[int, Field(strict=True, ge=1, le=5)]
    comment: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)] | None = None


class ReviewOut(CamelModel):
    id: str
    rating: int
    comment: str | None
    user: AuthorOut
    created_at: IsoDatetime


class LikeOut(CamelModel):
    liked: bool
    like_count: int
