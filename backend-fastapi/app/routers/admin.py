from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.deps import require_admin
from app.routers.params import Limit, PageNo
from app.schemas.admin import AdminCardOut, AdminUserOut
from app.schemas.common import Page
from app.services import admin as admin_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/recipes", response_model=Page[AdminCardOut])
async def recipes(q: Annotated[str | None, Query(min_length=1, max_length=100)] = None, page: PageNo = 1, limit: Limit = 12):
    return await admin_service.admin_recipes(q=q, page=page, limit=limit)


@router.get("/users", response_model=Page[AdminUserOut])
async def users(page: PageNo = 1, limit: Limit = 12):
    return await admin_service.list_users(page=page, limit=limit)


@router.get("/users/{user_id}/recipes", response_model=Page[AdminCardOut])
async def user_recipes(user_id: str, page: PageNo = 1, limit: Limit = 12):
    return await admin_service.user_recipes(user_id, page=page, limit=limit)
