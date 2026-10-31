# ADR-0005: Cloudinary for images, with a `CLOUDINARY_FAKE` switch for tests

## Status
Accepted

## Date
2026-10-31

## Context
Recipes have 1–3 photos (≤ 5 MB, JPEG/PNG/WebP). Both backends must store them in the same place and return the same `{ url, publicId }` shape. Automated tests must not call a paid external service or need real credentials.

## Decision
- Both backends upload to Cloudinary folder `recipebook/` (TRD §10) using the `cloudinary` SDK, with credentials from `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
- Size and type are checked on the server before uploading (multer in Express, `UploadFile` in FastAPI).
- When `CLOUDINARY_FAKE=1`, the upload service returns `{ url: "https://fake.cloudinary.test/recipebook/<uuid>.jpg", publicId: "recipebook/<uuid>" }` without a network call, and image deletion does nothing. This switch is the only difference between test and real behaviour; validation still runs.
- Deleting a recipe deletes its images by `publicId` after the database cascade.

## Alternatives Considered

### Local disk storage
- Pros: no account or keys.
- Cons: departs from the TRD; each backend would need to serve static files from a shared folder.
- Rejected: the user chose Cloudinary.

### Mock the Cloudinary SDK in each test
- Pros: no production code path for tests.
- Cons: the contract suite runs over HTTP against a separate process, so it can't mock in-process modules.
- Rejected: an env switch works for both backends and any HTTP client.

## Consequences
- Real uploads need a Cloudinary account and the three keys in `.env`. The manual upload check before Phase 6 needs them.
- Seed data uses placeholder image URLs that never go through the upload endpoint.
- If the Cloudinary delete fails after the database cascade, the recipe is already gone and the image is orphaned in Cloudinary. The error is logged and not surfaced to the user.
