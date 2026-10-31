# ADR-0002: `db/init-db.js` owns validators, indexes, and categories

## Status
Accepted

## Date
2026-10-31

## Context
Two ODMs (Mongoose and Beanie) write to the same collections. Both can create indexes automatically, and their default index names and options differ. If both did, the second backend to start could fail on an index conflict, or indexes could silently diverge. The assignment also has to show schema validation and index use (PRD G2, NFR-2).

## Decision
- `db/init-db.js`, run with mongosh inside the Docker container, is the only place that creates collections, applies strict `$jsonSchema` validators, creates the named indexes (`DATABASE_SCHEMA.md` §5), and inserts the 10 categories.
- Mongoose runs with `autoIndex: false`. Beanie Documents declare no indexes.
- The script is idempotent: it uses `collMod` on existing collections, `createIndex` (which does nothing if the index already exists), and upserts categories with `$setOnInsert`.
- The test database `recipebook_test` is set up with the same script, so tests run against the real validators and indexes.

## Alternatives Considered

### Let each ODM manage its own indexes
- Pros: no separate script; the schema lives next to the model.
- Cons: two sources of truth, possible name and option conflicts, and no database-level validation.
- Rejected: conflicts between the two backends are the very risk this avoids.

### Migrations tool (migrate-mongo or similar)
- Pros: versioned changes.
- Cons: an extra tool for a schema that is set up once.
- Rejected: an idempotent script is enough at this scale.

## Consequences
- Every fresh database needs one manual step: `docker compose exec mongo mongosh recipebook /scripts/init-db.js`. The README and test harness run it.
- The validator rejects bad documents from either backend, so app-level validation bugs surface as write errors rather than as bad data.
- The validator limits (e.g. user `name` 1–100) are looser than the app rules (2–60), so the apps stay the main validation layer and the database is the safety net.
- Changing an index or validator means editing this script and re-running it; models never change indexes.
