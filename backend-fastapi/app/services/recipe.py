import re
from datetime import UTC, datetime, timedelta

from bson import ObjectId

from app.core.errors import ApiError
from app.models.like import Like
from app.models.recipe import Recipe
from app.models.review import Review
from app.models.user import User
from app.schemas.common import Page
from app.schemas.recipe import CardOut, RecipeDetailOut, RecipeIn, RecipeOut, TrendingCardOut
from app.services.upload import delete_images

CARD_PROJECTION = {
    "title": 1, "dishName": 1, "images": {"$slice": 1}, "foodType": 1, "category": 1,
    "avgRating": 1, "reviewCount": 1, "likeCount": 1, "author": 1, "createdAt": 1,
}


def food_type_filter(food_type: str | None):
    # "Both" as $in (not a missing field) lets the {foodType, createdAt} indexes serve the sort via SORT_MERGE.
    return food_type or {"$in": ["veg", "nonveg"]}


def object_id(value: str, what: str = "Recipe") -> ObjectId:
    """A malformed id is "not found", like Mongoose's CastError in Express."""
    if not ObjectId.is_valid(value):
        raise ApiError(404, "NOT_FOUND", f"{what} not found")
    return ObjectId(value)


async def _users(ids) -> dict[str, dict]:
    users = await User.get_pymongo_collection().find({"_id": {"$in": list(set(ids))}}, {"name": 1, "email": 1}).to_list()
    return {str(u["_id"]): u for u in users}


async def to_cards(recipes: list[dict], model=CardOut, with_email: bool = False) -> list:
    """Raw recipe docs → API cards, with author names from one batched query (DATABASE_SCHEMA §6.2)."""
    users = await _users(r["author"] for r in recipes)
    cards = []
    for r in recipes:
        u = users.get(str(r["author"]), {})
        author = {"id": str(r["author"]), "name": u.get("name")}
        if with_email:  # admin views (AdminCardOut)
            author["email"] = u.get("email")
        cards.append(model.model_validate({**r, "id": str(r["_id"]), "image": r["images"][0], "author": author}))
    return cards


async def card_page(filter_: dict, page: int, limit: int, *, sort=None, projection=None, model=CardOut, with_email=False) -> Page:
    """One page of recipe cards, newest first unless `sort` says otherwise."""
    coll = Recipe.get_pymongo_collection()
    cursor = coll.find(filter_, projection or CARD_PROJECTION).sort(sort or [("createdAt", -1)]).skip((page - 1) * limit).limit(limit)
    docs, total = await cursor.to_list(), await coll.count_documents(filter_)
    return Page(items=await to_cards(docs, model, with_email), page=page, limit=limit, total=total)


def text_search(filter_: dict, q: str | None) -> dict:
    """Adds `$text` to `filter_` and returns card_page options for relevance order."""
    if not q:
        return {}
    filter_["$text"] = {"$search": q}
    return {
        "projection": {**CARD_PROJECTION, "score": {"$meta": "textScore"}},
        "sort": [("score", {"$meta": "textScore"}), ("createdAt", -1)],
    }


def _full(raw: dict, author_name: str | None) -> dict:
    return {**raw, "id": str(raw["_id"]), "author": {"id": str(raw["author"]), "name": author_name}}


async def _assert_category_exists(slug: str) -> None:
    if not await Recipe.get_pymongo_collection().database["categories"].count_documents({"slug": slug}, limit=1):
        raise ApiError(400, "VALIDATION_ERROR", f'category: unknown category "{slug}"')


async def create_recipe(body: RecipeIn, user: User) -> RecipeOut:
    """Raises 400 VALIDATION_ERROR for an unknown category."""
    await _assert_category_exists(body.category)
    now = datetime.now(UTC)  # one reading, so createdAt == updatedAt
    recipe = Recipe(**body.model_dump(), author=user.id, created_at=now, updated_at=now)
    await recipe.insert()
    return RecipeOut.model_validate(_full(recipe.model_dump(by_alias=True), user.name))


async def update_recipe(recipe_id: str, body: RecipeIn, user: User) -> RecipeOut:
    """Replaces the editable fields; author, counters, and createdAt are kept. 404 / 403 / 400."""
    coll = Recipe.get_pymongo_collection()
    oid = object_id(recipe_id)
    current = await coll.find_one({"_id": oid}, {"author": 1})
    if current is None:
        raise ApiError(404, "NOT_FOUND", "Recipe not found")
    if current["author"] != user.id:
        raise ApiError(403, "FORBIDDEN", "Only the author can edit this recipe")
    await _assert_category_exists(body.category)
    # $set only the editable fields. Beanie's save() would replace the whole document and write back
    # counters read before the edit, losing any like or review that landed in between.
    await coll.update_one({"_id": oid}, {"$set": {**body.model_dump(by_alias=True), "updatedAt": datetime.now(UTC)}})
    return RecipeOut.model_validate(_full(await coll.find_one({"_id": oid}), user.name))


async def get_recipe(recipe_id: str, user: User | None) -> RecipeDetailOut:
    """The full recipe plus likedByMe. 404 for an unknown or malformed id."""
    raw = await Recipe.get_pymongo_collection().find_one({"_id": object_id(recipe_id)})
    if raw is None:
        raise ApiError(404, "NOT_FOUND", "Recipe not found")
    author = await User.get_pymongo_collection().find_one({"_id": raw["author"]}, {"name": 1})
    liked = user is not None and await Like.get_pymongo_collection().find_one({"user": user.id, "recipe": raw["_id"]}) is not None
    return RecipeDetailOut.model_validate({**_full(raw, author and author["name"]), "likedByMe": liked})


async def list_recipes(*, q, food_type, category, dish, page, limit) -> Page:
    """Newest first, or by relevance with `q` (text index on title + dishName)."""
    filter_: dict = {"foodType": food_type_filter(food_type)}
    if category:
        filter_["category"] = category
    if dish:
        filter_["dishName"] = {"$regex": f"^{re.escape(' '.join(dish.split()))}$", "$options": "i"}
    return await card_page(filter_, page, limit, **text_search(filter_, q))


async def trending_recipes(*, food_type, days, limit) -> list[TrendingCardOut]:
    """Most-liked recipes in the last `days` days (DATABASE_SCHEMA §6.3), as cards with weekLikes."""
    since = datetime.now(UTC) - timedelta(days=days)
    rows = await Like.aggregate(
        [
            {"$match": {"createdAt": {"$gte": since}}},
            {"$group": {"_id": "$recipe", "weekLikes": {"$sum": 1}}},
            {"$sort": {"weekLikes": -1, "_id": 1}},
            # Take 30 before the lookup and `limit` after, so the food-type filter doesn't leave the list short.
            {"$limit": 30},
            {"$lookup": {"from": "recipes", "localField": "_id", "foreignField": "_id", "as": "recipe"}},
            {"$unwind": "$recipe"},
            *([{"$match": {"recipe.foodType": food_type}}] if food_type else []),
            {"$limit": limit},
            {"$replaceWith": {"$mergeObjects": ["$recipe", {"weekLikes": "$weekLikes"}]}},
        ]
    ).to_list()
    return await to_cards(rows, TrendingCardOut)


async def unused_public_ids(public_ids: list[str]) -> list[str]:
    """The given Cloudinary ids that no recipe references any more."""
    if not public_ids:
        return []
    still_used = set(await Recipe.get_pymongo_collection().distinct("images.publicId", {"images.publicId": {"$in": public_ids}}))
    return [pid for pid in public_ids if pid not in still_used]


async def delete_recipe(recipe_id: str, user: User) -> None:
    """Deletes a recipe with its reviews, likes, and unshared images (DATABASE_SCHEMA §6.8). 404 / 403.
    Not atomic (ADR-0003). The recipe goes last, so a failure part-way leaves it visible with stale
    counters, and deleting it again finishes the job."""
    coll = Recipe.get_pymongo_collection()
    recipe = await coll.find_one({"_id": object_id(recipe_id)}, {"author": 1, "images": 1})
    if recipe is None:
        raise ApiError(404, "NOT_FOUND", "Recipe not found")
    if recipe["author"] != user.id and user.role != "admin":
        raise ApiError(403, "FORBIDDEN", "Only the author or an admin can delete this recipe")
    await Review.get_pymongo_collection().delete_many({"recipe": recipe["_id"]})
    await Like.get_pymongo_collection().delete_many({"recipe": recipe["_id"]})
    await coll.delete_one({"_id": recipe["_id"]})
    # Another recipe may point at the same image; only delete images nobody uses now.
    await delete_images(await unused_public_ids([img["publicId"] for img in recipe["images"]]))


async def my_recipes(user: User, *, food_type, page, limit) -> Page:
    """The user's own recipes, newest first (uses the {author, createdAt} index)."""
    filter_: dict = {"author": user.id}
    if food_type:
        filter_["foodType"] = food_type
    return await card_page(filter_, page, limit)
