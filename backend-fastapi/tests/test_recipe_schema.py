import pytest
from pydantic import ValidationError

from app.schemas.recipe import RecipeIn

VALID = {
    "title": "Paneer Tikka", "dishName": "Paneer Tikka", "foodType": "veg", "category": "paneer", "difficulty": "easy",
    "servings": 2, "prepTimeMin": 10, "cookTimeMin": 20,
    "images": [{"url": "https://x.test/a.jpg", "publicId": "recipebook/a"}],
    "ingredients": [{"name": "Paneer"}],
    "instructions": [{"steps": [{"text": "Grill it."}]}],
}


def test_fills_missing_optionals_with_none_and_normalises_dish_name():
    body = RecipeIn.model_validate({**VALID, "dishName": "  Paneer \t Tikka  "})
    data = body.model_dump(by_alias=True)

    assert data["dishName"] == "Paneer Tikka"
    assert data["description"] is None
    assert data["ingredients"][0] == {"name": "Paneer", "quantity": None, "unit": None, "note": None}
    assert data["instructions"][0] == {"section": None, "steps": [{"text": "Grill it.", "durationMin": None, "tip": None}]}


def test_quantity_accepts_ints_and_floats():
    body = RecipeIn.model_validate({**VALID, "ingredients": [{"name": "A", "quantity": 2}, {"name": "B", "quantity": 1.5}]})

    assert [i.quantity for i in body.ingredients] == [2, 1.5]


def test_ignores_server_set_fields():
    body = RecipeIn.model_validate({**VALID, "author": "x", "likeCount": 9, "avgRating": 5})

    assert set(body.model_dump(by_alias=True)) == set(VALID) | {"description"}


@pytest.mark.parametrize(
    "overrides",
    [
        {"images": []},
        {"images": [{"url": "https://x.test/a.jpg", "publicId": "recipebook/a"}] * 4},
        {"images": [{"url": "https://x.test/a.jpg", "publicId": "other/a"}]},
        {"images": [{"url": "http://x.test/a.jpg", "publicId": "recipebook/a"}]},
        {"servings": 2.5},
        {"servings": "2"},
        {"ingredients": [{"name": "Salt", "quantity": "1.5"}]},
        {"servings": 0},
        {"prepTimeMin": 1441},
        {"title": "ab"},
        {"dishName": "  a  "},
        {"foodType": "vegan"},
        {"ingredients": []},
        {"instructions": [{"steps": [{"text": "ab"}]}]},
        {"instructions": [{"steps": []}]},
    ],
)
def test_rejects_invalid_recipes(overrides):
    with pytest.raises(ValidationError):
        RecipeIn.model_validate({**VALID, **overrides})
