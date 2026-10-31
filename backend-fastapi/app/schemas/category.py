from app.schemas.common import CamelModel


class CategoryOut(CamelModel):
    slug: str
    name: str
    image_url: str | None
    recipe_count: int
