import time

import bcrypt
import jwt

from app.core.config import settings

BCRYPT_COST = 12
TOKEN_TTL = 7 * 24 * 60 * 60


def _bytes(password: str) -> bytes:
    # bcryptjs (Express) silently uses the first 72 bytes; bcrypt 5 raises instead. Match bcryptjs.
    return password.encode()[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_bytes(password), bcrypt.gensalt(BCRYPT_COST)).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(_bytes(password), hashed.encode())


# Compared against when the email is unknown, so both login failures take the same time.
DUMMY_HASH = hash_password("timing-equaliser")


def create_token(user_id: str, role: str) -> str:
    """HS256 JWT `{sub, role, iat, exp}`, valid 7 days; same secret and claims as Express (ADR-0006)."""
    now = int(time.time())
    return jwt.encode({"sub": user_id, "role": role, "iat": now, "exp": now + TOKEN_TTL}, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict | None:
    """The token's claims, or None if it is missing, malformed, expired, or signed with another key."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None
