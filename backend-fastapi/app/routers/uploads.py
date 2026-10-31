from fastapi import APIRouter, Depends, File, UploadFile

from app.core.errors import ApiError
from app.deps import get_current_user
from app.services.upload import upload_image

router = APIRouter(prefix="/uploads", tags=["uploads"])

TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 5 * 1024 * 1024


@router.post("", status_code=201, dependencies=[Depends(get_current_user)])
async def create(image: UploadFile = File(...)):
    # shortcut: trusts the declared MIME type (Cloudinary rejects non-images on real uploads); sniff magic bytes if uploads go elsewhere.
    if image.content_type not in TYPES:
        raise ApiError(400, "VALIDATION_ERROR", "image must be JPEG, PNG, or WebP")
    data = await image.read(MAX_BYTES + 1)  # read one byte past the limit to detect oversize without loading more
    if len(data) > MAX_BYTES:
        raise ApiError(400, "VALIDATION_ERROR", "image must be 5 MB or smaller")
    return await upload_image(data)
