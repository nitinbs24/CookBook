from typing import Literal

from fastapi import APIRouter, Query

from app.schemas.category import CategoryOut
from app.services.category import list_categories

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
async def categories(food_type: Literal["veg", "nonveg"] | None = Query(default=None, alias="foodType")):
    return await list_categories(food_type)
