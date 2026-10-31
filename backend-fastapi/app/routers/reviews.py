from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User
from app.routers.params import Limit, PageNo
from app.schemas.common import Page
from app.schemas.review import ReviewIn, ReviewOut
from app.services import review as review_service

router = APIRouter(tags=["reviews"])


@router.get("/recipes/{recipe_id}/reviews", response_model=Page[ReviewOut])
async def list_reviews(recipe_id: str, page: PageNo = 1, limit: Limit = 12):
    return await review_service.list_reviews(recipe_id, page=page, limit=limit)


@router.post("/recipes/{recipe_id}/reviews", status_code=201, response_model=ReviewOut)
async def create_review(recipe_id: str, body: ReviewIn, user: User = Depends(get_current_user)):
    return await review_service.create_review(recipe_id, body, user)


@router.delete("/reviews/{review_id}", status_code=204)
async def delete_review(review_id: str, user: User = Depends(get_current_user)):
    await review_service.delete_review(review_id, user)
