import asyncio
import logging
import uuid

import cloudinary
import cloudinary.uploader
from starlette.concurrency import run_in_threadpool

from app.core.config import settings

log = logging.getLogger("recipebook")

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)


async def upload_image(data: bytes) -> dict:
    """Stores an already size- and type-checked image in Cloudinary `recipebook/` (ADR-0005).
    With CLOUDINARY_FAKE=1 returns a fake URL and makes no network call."""
    if settings.cloudinary_fake:
        public_id = f"recipebook/{uuid.uuid4()}"
        return {"url": f"https://fake.cloudinary.test/{public_id}.jpg", "publicId": public_id}
    # The Cloudinary SDK is synchronous; keep it off the event loop.
    result = await run_in_threadpool(cloudinary.uploader.upload, data, folder="recipebook", resource_type="image")
    return {"url": result["secure_url"], "publicId": result["public_id"]}


async def delete_images(public_ids: list[str]) -> None:
    """Deletes images from Cloudinary. Failures are logged, not raised: the recipe is already gone,
    so an orphaned image is the worst case (ADR-0005). No-op with CLOUDINARY_FAKE=1."""
    if settings.cloudinary_fake or not public_ids:
        return
    results = await asyncio.gather(
        *(run_in_threadpool(cloudinary.uploader.destroy, pid) for pid in public_ids), return_exceptions=True
    )
    for pid, result in zip(public_ids, results, strict=True):
        if isinstance(result, Exception):
            log.error("Cloudinary delete failed for %s: %s", pid, result)
