# ADR-0004: One shared HTTP contract test suite drives TDD and the parity check

## Status
Accepted

## Date
2026-10-31

## Context
Both backends must return identical responses (NFR-1). The TRD suggests running one Postman collection against `:5000` and `:8000`. We are building test-first, and we want the parity check automated and repeatable rather than a manual Postman run.

## Decision
- A standalone package, `contract-tests/` (Vitest + the `mongodb` driver), tests the API **over HTTP only**. It imports nothing from either backend.
- `BACKEND=express|fastapi` picks which backend the global setup starts, on a test port, with `MONGODB_URI=.../recipebook_test`, `CLOUDINARY_FAKE=1`, and a test `JWT_SECRET`. Setting `API_URL` skips the spawn and targets a server that is already running.
- The global setup runs `db/init-db.js` against `recipebook_test`. Before each test file, every collection except `categories` is emptied. Files run serially.
- Tests assert status codes, exact response key sets (`id` and never `_id`, no `passwordHash`), pagination shape, and the error shape `{ error: { code, message } }`.
- Express is built test-first against this suite. The FastAPI port is finished when the same suite passes unchanged.
- Each backend keeps its own small unit tests (Vitest for Express, pytest for FastAPI) for pure logic.
- This replaces the Postman collection from TRD §13.

## Alternatives Considered

### Separate suites per stack (supertest, pytest + httpx)
- Pros: in-process and faster; each stack's idioms.
- Cons: twice the test code, and nothing guarantees the two suites assert the same things.
- Rejected: parity is the whole point.

### Postman collection with Newman
- Pros: matches the TRD, and there's a GUI for the demo.
- Cons: assertions in JSON and JS snippets are awkward to write test-first, and DB reset hooks are clumsy.
- Rejected: the user chose a code suite instead.

## Consequences
- Contract tests are medium-sized (a real HTTP server and a real database), so they take seconds rather than milliseconds. They need Docker MongoDB running.
- Admin tests create an admin by updating `role` directly in the test database, since `/auth/register` always creates `role: user`.
- A failure on one backend and a pass on the other is a parity bug by definition.
