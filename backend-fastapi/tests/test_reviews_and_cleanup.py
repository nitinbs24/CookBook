import asyncio
import uuid
from datetime import UTC, datetime

import pytest
from bson import ObjectId
from pydantic import ValidationError

from app.schemas.review import ReviewIn
from app.services.review import round_rating


@pytest.mark.parametrize(("avg", "expected"), [(4.25, 4.3), (4.35, 4.4), (4.333, 4.3), (2.05, 2.1), (5.0, 5.0)])
def test_round_rating_rounds_halves_up_like_js_math_round(avg, expected):
    # Python's round() is banker's rounding: round(42.5) == 42, but Math.round(42.5) == 43 in Express.
    assert round_rating(avg) == expected


def test_review_comment_is_trimmed_and_optional():
    assert ReviewIn(rating=4, comment="  Lovely  ").comment == "Lovely"
    assert ReviewIn(rating=4).comment is None


@pytest.mark.parametrize("data", [{"rating": 0}, {"rating": 6}, {"rating": 2.5}, {"rating": "4"}, {}, {"rating": 4, "comment": "x" * 1001}])
def test_review_rejects_invalid_input(data):
    with pytest.raises(ValidationError):
        ReviewIn.model_validate(data)


def test_unused_public_ids_keeps_images_another_recipe_still_uses():
    """Needs Docker MongoDB (recipebook_test), like test_create_admin."""
    from app.core.db import init_db
    from app.models.recipe import Recipe
    from app.services.recipe import unused_public_ids

    marker = f"cleanup-{uuid.uuid4().hex[:8]}"

    async def scenario():
        client = await init_db()
        coll = Recipe.get_pymongo_collection()
        now = datetime.now(UTC)
        try:
            await coll.insert_one({
                "title": marker, "dishName": "Shared Dish", "author": ObjectId(), "foodType": "veg",
                "category": "paneer", "difficulty": "easy", "servings": 1, "prepTimeMin": 1, "cookTimeMin": 1,
                "images": [{"url": "https://x.test/s.jpg", "publicId": f"recipebook/{marker}-shared"}],
                "ingredients": [{"name": "Paneer"}], "instructions": [{"steps": [{"text": "Cook it."}]}],
                "avgRating": 0, "reviewCount": 0, "likeCount": 0, "createdAt": now, "updatedAt": now,
            })
            return await unused_public_ids([f"recipebook/{marker}-shared", f"recipebook/{marker}-mine"]), await unused_public_ids([])
        finally:
            await coll.delete_many({"title": marker})
            await client.close()

    result, empty = asyncio.run(scenario())
    assert result == [f"recipebook/{marker}-mine"]
    assert empty == []
