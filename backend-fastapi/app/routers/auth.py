from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User
from app.schemas.auth import AuthOut, LoginIn, RegisterIn, UserOut
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=201, response_model=AuthOut)
async def register(body: RegisterIn):
    return await auth_service.register(body)


@router.post("/login", response_model=AuthOut)
async def login(body: LoginIn):
    return await auth_service.login(body)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut.of(user)
