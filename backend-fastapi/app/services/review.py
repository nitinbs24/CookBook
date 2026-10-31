import math

from pymongo.errors import DuplicateKeyError

from app.core.errors import ApiError
from app.models.recipe import Recipe
from app.models.review import Review
from app.models.user import User
from app.schemas.common import Page
from app.schemas.review import ReviewIn, ReviewOut
from app.services.recipe import object_id


def round_rating(avg: float) -> float:
    """1 decimal, halves up, like Math.round(avg * 10) / 10 in Express (Python's round() rounds halves to even)."""
    return math.floor(avg * 10 + 0.5) / 10


async def recompute_rating(recipe_oid) -> None:
    """Sets avgRating and reviewCount from the recipe's reviews (DATABASE_SCHEMA §6.4). Also used by seed.py."""
    rows = await Review.aggregate(
        [{"$match": {"recipe": recipe_oid}}, {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "n": {"$sum": 1}}}]
    ).to_list()
    avg, n = (round_rating(rows[0]["avg"]), rows[0]["n"]) if rows else (0, 0)
    await Recipe.get_pymongo_collection().update_one({"_id": recipe_oid}, {"$set": {"avgRating": avg, "reviewCount": n}})


async def _recipe(recipe_id: str) -> dict:
    recipe = await Recipe.get_pymongo_collection().find_one({"_id": object_id(recipe_id)}, {"author": 1})
    if recipe is None:
        raise ApiError(404, "NOT_FOUND", "Recipe not found")
    return recipe


def _out(review: dict, name: str | None) -> ReviewOut:
    return ReviewOut.model_validate({**review, "id": str(review["_id"]), "user": {"id": str(review["user"]), "name": name}})


async def list_reviews(recipe_id: str, *, page: int, limit: int) -> Page:
    """A page of a recipe's reviews, newest first. 404 for an unknown recipe."""
    recipe = await _recipe(recipe_id)
    coll = Review.get_pymongo_collection()
    filter_ = {"recipe": recipe["_id"]}
    docs = await coll.find(filter_).sort("createdAt", -1).skip((page - 1) * limit).limit(limit).to_list()
    total = await coll.count_documents(filter_)
    users = await User.get_pymongo_collection().find({"_id": {"$in": [d["user"] for d in docs]}}, {"name": 1}).to_list()
    names = {u["_id"]: u["name"] for u in users}
    return Page(items=[_out(d, names.get(d["user"])) for d in docs], page=page, limit=limit, total=total)


async def create_review(recipe_id: str, body: ReviewIn, user: User) -> ReviewOut:
    """404 unknown recipe, 403 own recipe, 409 already reviewed."""
    recipe = await _recipe(recipe_id)
    if recipe["author"] == user.id:
        raise ApiError(403, "FORBIDDEN", "You cannot review your own recipe")
    review = Review(recipe=recipe["_id"], user=user.id, rating=body.rating, comment=body.comment)
    try:
        await review.insert()
    except DuplicateKeyError:
        raise ApiError(409, "CONFLICT", "You already reviewed this recipe") from None
    await recompute_rating(recipe["_id"])
    return _out(review.model_dump(by_alias=True), user.name)


async def delete_review(review_id: str, user: User) -> None:
    """Reviewer or admin; recomputes the recipe's rating. 404 / 403."""
    coll = Review.get_pymongo_collection()
    review = await coll.find_one({"_id": object_id(review_id, "Review")})
    if review is None:
        raise ApiError(404, "NOT_FOUND", "Review not found")
    if review["user"] != user.id and user.role != "admin":
        raise ApiError(403, "FORBIDDEN", "Only the reviewer or an admin can delete this review")
    await coll.delete_one({"_id": review["_id"]})
    await recompute_rating(review["recipe"])
