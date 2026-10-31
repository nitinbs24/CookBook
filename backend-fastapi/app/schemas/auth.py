from typing import Annotated

from pydantic import StringConstraints

from app.models.user import User
from app.schemas.common import CamelModel, IsoDatetime

# Typed strings also block NoSQL injection: {"$gt": ""} is not a str (TRD §9).
LoweredEmail = Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True)]


class RegisterIn(CamelModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=60)]
    email: Annotated[LoweredEmail, StringConstraints(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    password: Annotated[str, StringConstraints(min_length=8, max_length=72)]


class LoginIn(CamelModel):
    email: LoweredEmail
    password: Annotated[str, StringConstraints(min_length=1)]


class UserOut(CamelModel):
    id: str
    name: str
    email: str
    role: str
    created_at: IsoDatetime

    @classmethod
    def of(cls, user: User) -> "UserOut":
        return cls(id=str(user.id), name=user.name, email=user.email, role=user.role, created_at=user.created_at)


class AuthOut(CamelModel):
    user: UserOut
    token: str
