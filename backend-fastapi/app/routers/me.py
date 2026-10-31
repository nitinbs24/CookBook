from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User
from app.routers.params import FoodType, Limit, PageNo
from app.schemas.common import Page
from app.schemas.recipe import CardOut
from app.services.like import my_likes
from app.services.recipe import my_recipes

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/likes", response_model=Page[CardOut])
async def likes(food_type: FoodType = None, page: PageNo = 1, limit: Limit = 12, user: User = Depends(get_current_user)):
    return await my_likes(user, food_type=food_type, page=page, limit=limit)


@router.get("/recipes", response_model=Page[CardOut])
async def recipes(food_type: FoodType = None, page: PageNo = 1, limit: Limit = 12, user: User = Depends(get_current_user)):
    return await my_recipes(user, food_type=food_type, page=page, limit=limit)
