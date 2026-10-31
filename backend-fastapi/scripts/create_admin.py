"""Usage: .venv/bin/python -m scripts.create_admin <email> <password> [name]

Promotes an existing user to admin, or creates a new admin. /auth/register never makes admins.
"""

import asyncio
import sys

from pydantic import ValidationError

from app.core.db import init_db
from app.core.security import hash_password
from app.models.user import User
from app.schemas.auth import RegisterIn


async def main(args: list[str]) -> int:
    usage = "Usage: python -m scripts.create_admin <email> <password> [name]"
    if len(args) < 2:
        print(usage, file=sys.stderr)
        return 1
    try:
        body = RegisterIn(email=args[0], password=args[1], name=args[2] if len(args) > 2 else "Admin")
    except ValidationError as err:
        print(f"{usage}\n{err}", file=sys.stderr)
        return 1
    client = await init_db()
    try:
        user = await User.find_one(User.email == body.email)
        if user:
            user.role = "admin"
            await user.save()
            print(f"Promoted {body.email} to admin (password unchanged)")
        else:
            await User(name=body.name, email=body.email, password_hash=hash_password(body.password), role="admin").insert()
            print(f"Created admin {body.email}")
    finally:
        await client.close()
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main(sys.argv[1:])))
