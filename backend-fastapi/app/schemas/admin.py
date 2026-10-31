from app.schemas.common import CamelModel, IsoDatetime
from app.schemas.recipe import AuthorOut, CardOut


class AdminAuthorOut(AuthorOut):
    email: str | None


class AdminCardOut(CardOut):
    author: AdminAuthorOut


class AdminUserOut(CamelModel):
    id: str
    name: str
    email: str
    role: str
    created_at: IsoDatetime
    recipe_count: int
