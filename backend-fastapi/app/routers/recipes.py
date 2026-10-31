from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from app.deps import get_current_user, get_optional_user
from app.models.user import User
from app.schemas.common import Page
from app.schemas.recipe import CardOut, RecipeDetailOut, RecipeIn, RecipeOut, TrendingCardOut
from app.services import recipe as recipe_service

router = APIRouter(prefix="/recipes", tags=["recipes"])

FoodType = Annotated[Literal["veg", "nonveg"] | None, Query(alias="foodType")]
PageNo = Annotated[int, Query(ge=1)]
Limit = Annotated[int, Query(ge=1, le=50)]


@router.get("", response_model=Page[CardOut])
async def list_recipes(
    food_type: FoodType = None,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    category: Annotated[str | None, Query(min_length=1)] = None,
    dish: Annotated[str | None, Query(min_length=1, max_length=80)] = None,
    page: PageNo = 1,
    limit: Limit = 12,
):
    return await recipe_service.list_recipes(q=q, food_type=food_type, category=category, dish=dish, page=page, limit=limit)


# Registered before /{recipe_id}, or "trending" would be read as an id.
@router.get("/trending", response_model=list[TrendingCardOut])
async def trending(food_type: FoodType = None, days: Annotated[int, Query(ge=1, le=365)] = 7, limit: Limit = 10):
    return await recipe_service.trending_recipes(food_type=food_type, days=days, limit=limit)


@router.get("/{recipe_id}", response_model=RecipeDetailOut)
async def get_recipe(recipe_id: str, user: User | None = Depends(get_optional_user)):
    return await recipe_service.get_recipe(recipe_id, user)


@router.post("", status_code=201, response_model=RecipeOut)
async def create_recipe(body: RecipeIn, user: User = Depends(get_current_user)):
    return await recipe_service.create_recipe(body, user)


@router.put("/{recipe_id}", response_model=RecipeOut)
async def update_recipe(recipe_id: str, body: RecipeIn, user: User = Depends(get_current_user)):
    return await recipe_service.update_recipe(recipe_id, body, user)
