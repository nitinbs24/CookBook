from app.core.errors import ApiError
from app.models.user import User
from app.schemas.admin import AdminCardOut, AdminUserOut
from app.schemas.common import Page
from app.services.recipe import card_page, object_id, text_search


async def admin_recipes(*, q, page, limit) -> Page:
    """Every user's recipes, newest first (or by relevance with q), with author.email."""
    filter_: dict = {}
    return await card_page(filter_, page, limit, model=AdminCardOut, with_email=True, **text_search(filter_, q))


async def list_users(*, page, limit) -> Page:
    """Users, newest first, with recipe counts (DATABASE_SCHEMA §6.7)."""
    rows = await User.aggregate(
        [
            {"$sort": {"createdAt": -1}},
            {"$skip": (page - 1) * limit},
            {"$limit": limit},
            # Count through the {author, createdAt} index instead of loading every recipe.
            {"$lookup": {"from": "recipes", "localField": "_id", "foreignField": "author", "pipeline": [{"$count": "n"}], "as": "r"}},
        ]
    ).to_list()
    total = await User.get_pymongo_collection().count_documents({})
    items = [AdminUserOut.model_validate({**u, "id": str(u["_id"]), "recipeCount": u["r"][0]["n"] if u["r"] else 0}) for u in rows]
    return Page(items=items, page=page, limit=limit, total=total)


async def user_recipes(user_id: str, *, page, limit) -> Page:
    """One user's recipes, newest first. 404 for an unknown user."""
    oid = object_id(user_id, "User")
    if not await User.get_pymongo_collection().count_documents({"_id": oid}, limit=1):
        raise ApiError(404, "NOT_FOUND", "User not found")
    return await card_page({"author": oid}, page, limit, model=AdminCardOut, with_email=True)
