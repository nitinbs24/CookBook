from pymongo.errors import DuplicateKeyError

from app.core.errors import ApiError
from app.core.security import DUMMY_HASH, create_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthOut, LoginIn, RegisterIn, UserOut


def _session(user: User) -> AuthOut:
    return AuthOut(user=UserOut.of(user), token=create_token(str(user.id), user.role))


async def register(body: RegisterIn) -> AuthOut:
    """Creates a user (always role "user") and logs them in. Raises 409 CONFLICT for a taken email."""
    user = User(name=body.name, email=body.email, password_hash=hash_password(body.password))
    try:
        await user.insert()
    except DuplicateKeyError:
        raise ApiError(409, "CONFLICT", "Email is already registered") from None
    return _session(user)


async def login(body: LoginIn) -> AuthOut:
    """One generic 401 for any wrong credential, timed the same for unknown emails."""
    user = await User.find_one(User.email == body.email)
    ok = verify_password(body.password, user.password_hash if user else DUMMY_HASH)
    if user is None or not ok:
        raise ApiError(401, "UNAUTHENTICATED", "Email or password is incorrect")
    return _session(user)
