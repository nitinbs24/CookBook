from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User
from app.schemas.review import LikeOut
from app.services import like as like_service

router = APIRouter(prefix="/recipes", tags=["likes"])


@router.post("/{recipe_id}/like", response_model=LikeOut)
async def like(recipe_id: str, user: User = Depends(get_current_user)):
    return await like_service.like(user, recipe_id)


@router.delete("/{recipe_id}/like", response_model=LikeOut)
async def unlike(recipe_id: str, user: User = Depends(get_current_user)):
    return await like_service.unlike(user, recipe_id)
