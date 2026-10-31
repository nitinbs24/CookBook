# ADR-0008: Beanie 2 on PyMongo async, camelCase aliases, plain ObjectId references

## Status
Accepted

## Date
2026-10-31

## Context
The FastAPI backend must read and write exactly the documents the Express backend does (ADR-0001), and pass the same contract suite (ADR-0004). Beanie 1.x and many tutorials use Motor, which is deprecated; Beanie 2 runs on PyMongo's own async client (TRD D9). Pydantic's defaults (snake_case fields, 422 errors, microsecond ISO dates) and Beanie's defaults (`Link` references, the `id` ↔ `_id` mapping) all differ from what Express writes and returns.

## Decision
- **Stack:** Python 3.12 (the TRD version; also installed locally), FastAPI, Beanie 2 with `pymongo.AsyncMongoClient(tz_aware=True)`, Pydantic 2, pydantic-settings reading the repo-root `.env`.
- **Stored names are camelCase.** Every Document and embedded model uses one alias generator (`app/models/base.py`): `to_camel`, except `id` stays `_id`. A plain `to_camel` generator overrides Beanie's own `_id` alias, so documents loaded from MongoDB come back with `id = None`. The contract suite caught this. Embedded items are plain Pydantic models, so they get no `_id`.
- **References are `PydanticObjectId` fields, not Beanie `Link`s,** so stored documents and queries match Mongoose's.
- **No indexes or validators in Beanie** (ADR-0002). `init_beanie` only registers the models.
- **Response schemas, never Documents:** a `CamelModel` base (camelCase on the wire) with explicit `UserOut`, `AuthOut`, and so on, so `passwordHash` can't leak and `_id` becomes `id`. Dates serialise as `YYYY-MM-DDTHH:MM:SS.mmmZ`, exactly what `JSON.stringify(Date)` gives in Express.
- **Errors match Express:** a `RequestValidationError` (FastAPI's 422) becomes 400 `VALIDATION_ERROR` with a `"<path>: <message>"` message using the same field paths. An unknown route or method is 404 `NOT_FOUND`, a duplicate key is 409, and anything else is 500 `INTERNAL`.
- **Password parity:** bcrypt cost 12. Passwords are cut to their first 72 bytes before hashing, because `bcryptjs` does that silently while `bcrypt` 5 raises an error (a 72-character password with non-ASCII letters can exceed 72 bytes). Hashes from either backend verify in the other.
- **Timestamps are set by the app** (`created_at`, `updated_at` default to `datetime.now(UTC)`), since Beanie has no automatic timestamps.

## Alternatives Considered

### Beanie `Link` references
- Pros: `fetch_links` loads authors automatically.
- Cons: stores `DBRef`-style data and builds different queries from Mongoose's.
- Rejected: documents must be interchangeable.

### Motor + Beanie 1.x
- Pros: matches most tutorials.
- Cons: Motor is deprecated, and Beanie 2 dropped it.
- Rejected (TRD D9).

### Snake_case in MongoDB with camelCase only in the API
- Pros: idiomatic Python models.
- Cons: Express would not read FastAPI's documents, and vice versa.
- Rejected (TRD D3).

## Consequences
- Every new model must use `DOCUMENT_CONFIG` from `app/models/base.py`. Every new response must be a `CamelModel`, with `IsoDatetime` for dates.
- Path parameters that are ids are taken as strings and checked in the service, so a malformed id is 404 like Express, not a 400 validation error.
- Users created by either backend log in on the other, and one JWT works on both (checked in Phase 7).
