"""Usage: .venv/bin/python -m scripts.seed            (refuses if the DB already has users or recipes)
       .venv/bin/python -m scripts.seed --reset    (deletes users, recipes, reviews, likes first; categories kept)

Port of backend-express/scripts/seed.js: same users, recipes, likes, and reviews, in the same order and
with the same pseudo-random sequence, so either backend seeds identical demo data. Counters are set
through the same helpers the API uses.
"""

import asyncio
import sys
from datetime import UTC, datetime, timedelta

from app.core.db import init_db
from app.core.security import hash_password
from app.models.like import Like
from app.models.recipe import Recipe
from app.models.review import Review
from app.models.user import User
from app.services.like import like
from app.services.review import recompute_rating

PASSWORD = "password123"
DAY = timedelta(days=1)

# seed.js's generator overflows JS's exact-integer range (2**53), so it is really float arithmetic.
# Doing the same IEEE-754 double maths here reproduces its sequence exactly.
_state = 42.0


def rand() -> float:
    global _state
    _state = (_state * 1103515245.0 + 12345.0) % 2147483648.0
    return _state / 2147483648.0


def pick(items, i=None):
    return items[int(rand() * len(items))] if i is None else items[i % len(items)]


USERS = [
    ("Site Admin", "admin@recipebook.test", "admin"),
    ("Asha Rao", "asha@recipebook.test", "user"),
    ("Ravi Kumar", "ravi@recipebook.test", "user"),
    ("Meera Iyer", "meera@recipebook.test", "user"),
    ("Kabir Singh", "kabir@recipebook.test", "user"),
    ("Fatima Sheikh", "fatima@recipebook.test", "user"),
]

# (title, dishName, category, foodType, difficulty, prepMin, cookMin, servings)
RECIPES = [
    ("Dhaba-style Paneer Butter Masala", "Paneer Butter Masala", "paneer", "veg", "medium", 20, 35, 4),
    ("Restaurant Paneer Butter Masala", "Paneer Butter Masala", "paneer", "veg", "medium", 25, 40, 4),
    ("Quick Weeknight Paneer Butter Masala", "Paneer Butter Masala", "paneer", "veg", "easy", 10, 20, 3),
    ("Smoky Paneer Tikka", "Paneer Tikka", "paneer", "veg", "medium", 40, 15, 4),
    ("Palak Paneer", "Palak Paneer", "paneer", "veg", "easy", 15, 25, 4),
    ("Old Delhi Butter Chicken", "Butter Chicken", "chicken", "nonveg", "hard", 60, 45, 4),
    ("Home-style Butter Chicken", "Butter Chicken", "chicken", "nonveg", "medium", 30, 35, 4),
    ("Chettinad Chicken Curry", "Chicken Chettinad", "chicken", "nonveg", "medium", 20, 40, 4),
    ("Crispy Chicken 65", "Chicken 65", "chicken", "nonveg", "medium", 30, 20, 3),
    ("Dhaba Egg Curry", "Egg Curry", "egg", "nonveg", "easy", 10, 25, 3),
    ("Kerala Egg Roast", "Egg Curry", "egg", "nonveg", "medium", 15, 30, 3),
    ("Masala Omelette", "Masala Omelette", "egg", "nonveg", "easy", 5, 5, 1),
    ("Aloo Gobi", "Aloo Gobi", "potato", "veg", "easy", 15, 25, 4),
    ("Kashmiri Dum Aloo", "Dum Aloo", "potato", "veg", "medium", 20, 40, 4),
    ("Punjabi Aloo Paratha", "Aloo Paratha", "potato", "veg", "medium", 30, 20, 4),
    ("Mutton Rogan Josh", "Rogan Josh", "mutton", "nonveg", "hard", 30, 90, 5),
    ("Mutton Keema Matar", "Keema", "mutton", "nonveg", "medium", 15, 40, 4),
    ("Goan Fish Curry", "Fish Curry", "fish-seafood", "nonveg", "medium", 20, 25, 4),
    ("Prawn Masala", "Prawn Masala", "fish-seafood", "nonveg", "medium", 20, 20, 3),
    ("Amritsari Fish Fry", "Fish Fry", "fish-seafood", "nonveg", "easy", 30, 15, 3),
    ("Everyday Dal Tadka", "Dal Tadka", "dal-lentils", "veg", "easy", 10, 30, 4),
    ("Dhaba Dal Tadka", "Dal Tadka", "dal-lentils", "veg", "easy", 15, 35, 4),
    ("Slow-cooked Dal Makhani", "Dal Makhani", "dal-lentils", "veg", "hard", 480, 120, 6),
    ("Hyderabadi Chicken Biryani", "Chicken Biryani", "rice-biryani", "nonveg", "hard", 60, 60, 6),
    ("Kolkata Chicken Biryani", "Chicken Biryani", "rice-biryani", "nonveg", "hard", 60, 75, 6),
    ("Simple Veg Pulao", "Veg Pulao", "rice-biryani", "veg", "easy", 15, 25, 4),
    ("Mushroom Masala", "Mushroom Masala", "mushroom", "veg", "easy", 10, 20, 3),
    ("Mushroom Do Pyaza", "Mushroom Do Pyaza", "mushroom", "veg", "medium", 15, 25, 3),
    ("Soft Gulab Jamun", "Gulab Jamun", "sweets-desserts", "veg", "medium", 20, 30, 6),
    ("Winter Gajar Ka Halwa", "Gajar Halwa", "sweets-desserts", "veg", "medium", 20, 60, 6),
]

MAIN = {
    "paneer": ("Paneer", 250, "g"), "chicken": ("Chicken", 500, "g"), "egg": ("Eggs", 4, "pcs"), "potato": ("Potatoes", 4, "pcs"),
    "mutton": ("Mutton", 500, "g"), "fish-seafood": ("Fish or prawns", 400, "g"), "dal-lentils": ("Lentils", 1, "cup"),
    "rice-biryani": ("Basmati rice", 2, "cups"), "mushroom": ("Mushrooms", 300, "g"), "sweets-desserts": ("Milk", 1, "litre"),
}

# Food photos from TheMealDB (themealdb.com), hot-linked; cycled within each category.
PHOTO = "https://www.themealdb.com/images/media/meals/{}.jpg"
PHOTOS = {
    "paneer": ["xxpqsy1511452222"], "chicken": ["qptpvt1487339892", "wyxwsp1486979827", "yxsurp1511304301"],
    "egg": ["g373701551450225"], "potato": ["1550441882"], "mutton": ["vvstvq1487342592"],
    "fish-seafood": ["r7mcjm1780261264", "qqlwv91763501559"], "dal-lentils": ["wuxrtu1483564410", "sywrsu1511463066"],
    "rice-biryani": ["xrttsx1487339558", "1550441275"], "mushroom": ["0r7y5n1782681336"], "sweets-desserts": ["vrspxv1511722107"],
}
# Veg recipes in a category whose photos show meat or egg get a vegetarian photo instead.
VEG_PHOTOS = {"rice-biryani": ["j8c1d51782772399"]}

COMMENTS = [
    "Turned out perfect, the family loved it.", "Great balance of spices.", "Easy to follow, will make again.",
    "A bit spicy for us, but delicious.", "Better than the restaurant version!", None, None,
]


def content(title: str, category: str) -> dict:
    main, quantity, unit = MAIN[category]
    item = main.lower()
    if category == "sweets-desserts":
        return {
            "ingredients": [
                {"name": main, "quantity": quantity, "unit": unit, "note": "full fat"},
                {"name": "Sugar", "quantity": 1, "unit": "cup", "note": None},
                {"name": "Ghee", "quantity": 3, "unit": "tbsp", "note": None},
                {"name": "Cardamom", "quantity": 4, "unit": "pods", "note": "crushed"},
            ],
            "instructions": [
                {"section": "Base", "steps": [{"text": f"Simmer the {item} until it thickens, stirring often.", "duration_min": 30, "tip": "Use a heavy pan so it does not catch."}]},
                {"section": "Finish", "steps": [
                    {"text": "Add sugar, ghee, and cardamom, then cook until glossy.", "duration_min": 10, "tip": None},
                    {"text": f"Serve {title} warm or chilled.", "duration_min": None, "tip": None},
                ]},
            ],
        }
    return {
        "ingredients": [
            {"name": main, "quantity": quantity, "unit": unit, "note": None},
            {"name": "Onions", "quantity": 2, "unit": "pcs", "note": "finely chopped"},
            {"name": "Tomatoes", "quantity": 3, "unit": "pcs", "note": "pureed"},
            {"name": "Ginger-garlic paste", "quantity": 1, "unit": "tbsp", "note": None},
            {"name": "Garam masala", "quantity": 1, "unit": "tsp", "note": None},
            {"name": "Oil", "quantity": 2, "unit": "tbsp", "note": None},
            {"name": "Salt", "quantity": None, "unit": None, "note": "to taste"},
        ],
        "instructions": [
            {"section": "Prep", "steps": [{"text": f"Clean and cut the {item}; chop the onions and puree the tomatoes.", "duration_min": 10, "tip": None}]},
            {"section": "Cook", "steps": [
                {"text": "Heat oil, fry the onions until golden, then add the ginger-garlic paste.", "duration_min": 8, "tip": "Golden, not brown: burnt onions turn the gravy bitter."},
                {"text": "Add the tomato puree and spices; cook until the oil separates.", "duration_min": 10, "tip": None},
                {"text": f"Add the {item}, cover, and simmer until done. Finish with garam masala.", "duration_min": 15, "tip": None},
            ]},
        ],
    }


async def main(reset: bool) -> int:
    client = await init_db()
    try:
        print(f'Seeding database "{client.get_default_database().name}"{" (reset)" if reset else ""}')
        if not reset and (await User.get_pymongo_collection().estimated_document_count() or await Recipe.get_pymongo_collection().estimated_document_count()):
            print("Database already has users or recipes. Run `python -m scripts.seed --reset` to replace them.", file=sys.stderr)
            return 1
        if reset:
            for model in (User, Recipe, Review, Like):
                await model.get_pymongo_collection().delete_many({})

        password_hash = hash_password(PASSWORD)
        users = [User(name=name, email=email, password_hash=password_hash, role=role) for name, email, role in USERS]
        for user in users:
            await user.insert()
        cooks = users[1:]

        now = datetime.now(UTC)
        recipes = []
        for i, (title, dish, category, food_type, difficulty, prep, cook, servings) in enumerate(RECIPES):
            created = now - (30 - i) * DAY
            photos = VEG_PHOTOS[category] if food_type == "veg" and category in VEG_PHOTOS else PHOTOS[category]
            recipe = Recipe(
                title=title, dish_name=dish, category=category, food_type=food_type, difficulty=difficulty,
                prep_time_min=prep, cook_time_min=cook, servings=servings,
                description=f"{title}: {'an' if difficulty == 'easy' else 'a'} {difficulty} {'vegetarian' if food_type == 'veg' else 'non-vegetarian'} favourite.",
                author=cooks[i % len(cooks)].id,
                images=[{"url": PHOTO.format(pick(photos, i)), "public_id": f"recipebook/seed-{i + 1}"}],
                created_at=created, updated_at=created, **content(title, category),
            )
            await recipe.insert()
            recipes.append(recipe)

        # Likes: unique (user, recipe) pairs, dated over the last 14 days.
        liked = set()
        while len(liked) < 100:
            user, recipe = pick(users), pick(recipes)
            if (user.id, recipe.id) in liked:
                continue
            liked.add((user.id, recipe.id))
            await like(user, str(recipe.id))
            await Like.get_pymongo_collection().update_one(
                {"user": user.id, "recipe": recipe.id}, {"$set": {"createdAt": now - rand() * 14 * DAY}}
            )

        # Reviews: unique (user, recipe), never on your own recipe, mostly 3–5 stars.
        reviewed = set()
        while len(reviewed) < 50:
            user, recipe = pick(users), pick(recipes)
            if (user.id, recipe.id) in reviewed or recipe.author == user.id:
                continue
            reviewed.add((user.id, recipe.id))
            review = Review(recipe=recipe.id, user=user.id, rating=pick([3, 4, 4, 5, 5, 5, 2]), comment=pick(COMMENTS))
            await review.insert()
            await Review.get_pymongo_collection().update_one({"_id": review.id}, {"$set": {"createdAt": now - rand() * 14 * DAY}})
        for recipe in recipes:
            await recompute_rating(recipe.id)

        print(f"Seeded {len(users)} users, {len(recipes)} recipes, {len(liked)} likes, {len(reviewed)} reviews.")
        print(f'Log in as admin@recipebook.test or asha@recipebook.test (and others) with password "{PASSWORD}".')
        return 0
    finally:
        await client.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main("--reset" in sys.argv[1:])))
