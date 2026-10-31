from app.models.recipe import Recipe
from app.schemas.category import CategoryOut


async def list_categories(food_type: str | None) -> list[CategoryOut]:
    """Category tiles with recipe counts (DATABASE_SCHEMA §6.1); empty categories drop out on their own."""
    rows = await Recipe.aggregate(
        [
            {"$match": {"foodType": food_type} if food_type else {}},
            {"$group": {"_id": "$category", "recipeCount": {"$sum": 1}}},
            {"$lookup": {"from": "categories", "localField": "_id", "foreignField": "slug", "as": "c"}},
            {"$unwind": "$c"},
            {"$sort": {"c.order": 1}},
            {"$project": {"_id": 0, "slug": "$c.slug", "name": "$c.name", "imageUrl": "$c.imageUrl", "recipeCount": 1}},
        ]
    ).to_list()
    return [CategoryOut.model_validate(r) for r in rows]
