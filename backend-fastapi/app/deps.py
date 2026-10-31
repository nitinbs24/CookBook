import re

from beanie import PydanticObjectId
from bson import ObjectId
from fastapi import Depends, Header

from app.core.errors import ApiError
from app.core.security import decode_token
from app.models.user import User


async def _user_from_header(authorization: str | None) -> User | None:
    match = re.match(r"^Bearer (.+)$", authorization or "")
    payload = decode_token(match[1]) if match else None
    sub = payload.get("sub") if payload else None
    if not isinstance(sub, str) or not ObjectId.is_valid(sub):
        return None
    return await User.get(PydanticObjectId(sub))  # role always comes from the DB, not the token


async def get_optional_user(authorization: str | None = Header(default=None)) -> User | None:
    """The logged-in user, or None: a missing or bad token means "guest", never an error."""
    return await _user_from_header(authorization)


async def get_current_user(authorization: str | None = Header(default=None)) -> User:
    """The logged-in user, or 401."""
    user = await _user_from_header(authorization)
    if user is None:
        raise ApiError(401, "UNAUTHENTICATED", "Login required")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """401 without a login, 403 for non-admins. The API enforces this; the UI only hides the page."""
    if user.role != "admin":
        raise ApiError(403, "FORBIDDEN", "Admins only")
    return user
