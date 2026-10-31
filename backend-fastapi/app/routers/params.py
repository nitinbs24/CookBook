"""Query parameters shared by the list endpoints (TRD §6.1)."""

from typing import Annotated, Literal

from fastapi import Query

FoodType = Annotated[Literal["veg", "nonveg"] | None, Query(alias="foodType")]
PageNo = Annotated[int, Query(ge=1)]
Limit = Annotated[int, Query(ge=1, le=50)]
