from beanie import init_beanie
from pymongo import AsyncMongoClient

from app.core.config import settings
from app.models.like import Like
from app.models.recipe import Recipe
from app.models.user import User


async def init_db() -> AsyncMongoClient:
    """Connects and registers the Beanie documents. db/init-db.js owns indexes (ADR-0002): none are declared here."""
    client = AsyncMongoClient(settings.mongodb_uri, tz_aware=True)
    await init_beanie(database=client.get_default_database(), document_models=[User, Recipe, Like])
    return client
