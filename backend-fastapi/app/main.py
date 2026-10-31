from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import init_db
from app.core.errors import register_error_handlers
from app.routers import auth, categories, recipes, uploads


@asynccontextmanager
async def lifespan(_app: FastAPI):
    client = await init_db()
    yield
    await client.close()


app = FastAPI(title="Recipe Book API", lifespan=lifespan)
register_error_handlers(app)
# Added last so it is the outermost middleware: every response, errors included, gets CORS headers.
app.add_middleware(CORSMiddleware, allow_origins=[settings.cors_origin], allow_methods=["*"], allow_headers=["*"])

api = APIRouter(prefix="/api/v1")
api.include_router(auth.router)
api.include_router(categories.router)
api.include_router(recipes.router)
api.include_router(uploads.router)
app.include_router(api)
