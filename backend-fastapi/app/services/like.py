from pymongo.errors import DuplicateKeyError

from app.core.errors import ApiError
from app.models.like import Like
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.common import Page
from app.schemas.review import LikeOut
from app.services.recipe import object_id, to_cards


async def _like_count(recipe_oid) -> int:
    recipe = await Recipe.get_pymongo_collection().find_one({"_id": recipe_oid}, {"likeCount": 1})
    if recipe is None:
        raise ApiError(404, "NOT_FOUND", "Recipe not found")
    return recipe["likeCount"]


async def like(user: User, recipe_id: str) -> LikeOut:
    """Idempotent (DATABASE_SCHEMA §6.5): the unique {user, recipe} index turns a second like into a
    duplicate-key error, and the counter only moves after a real insert. 404 for an unknown recipe."""
    oid = object_id(recipe_id)
    await _like_count(oid)
    try:
        await Like(user=user.id, recipe=oid).insert()
        await Recipe.get_pymongo_collection().update_one({"_id": oid}, {"$inc": {"likeCount": 1}})
    except DuplicateKeyError:
        pass  # already liked
    return LikeOut(liked=True, like_count=await _like_count(oid))


async def unlike(user: User, recipe_id: str) -> LikeOut:
    """The counter only moves if a like was actually removed. 404 for an unknown recipe."""
    oid = object_id(recipe_id)
    await _like_count(oid)
    result = await Like.get_pymongo_collection().delete_one({"user": user.id, "recipe": oid})
    if result.deleted_count == 1:
        await Recipe.get_pymongo_collection().update_one({"_id": oid}, {"$inc": {"likeCount": -1}})
    return LikeOut(liked=False, like_count=await _like_count(oid))


async def my_likes(user: User, *, food_type, page, limit) -> Page:
    """Want to try: liked recipes, most recently liked first (DATABASE_SCHEMA §6.6)."""
    [result] = await Like.aggregate(
        [
            {"$match": {"user": user.id}},
            {"$sort": {"createdAt": -1}},
            {"$lookup": {"from": "recipes", "localField": "recipe", "foreignField": "_id", "as": "r"}},
            {"$unwind": "$r"},
            *([{"$match": {"r.foodType": food_type}}] if food_type else []),
            {"$facet": {"items": [{"$skip": (page - 1) * limit}, {"$limit": limit}, {"$replaceWith": "$r"}], "total": [{"$count": "n"}]}},
        ]
    ).to_list()
    total = result["total"][0]["n"] if result["total"] else 0
    return Page(items=await to_cards(result["items"]), page=page, limit=limit, total=total)
