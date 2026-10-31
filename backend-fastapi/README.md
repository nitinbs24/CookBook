# Recipe Book — FastAPI backend

FastAPI + Beanie 2 (on PyMongo's async client), Python 3.12. Serves the same `/api/v1` contract as `backend-express` on `:8000`. Reads the repo-root `.env` (variables already set in the environment win). Interactive API docs at `http://localhost:8000/docs`.

| Command (from `backend-fastapi/`) | What |
|---|---|
| `python3.12 -m venv .venv && .venv/bin/pip install -r requirements.txt` | Set up |
| `.venv/bin/uvicorn app.main:app --reload --port 8000` | Start with auto-reload |
| `.venv/bin/python -m pytest` | Unit tests (`test_create_admin.py` needs Docker MongoDB) |
| `cd ../contract-tests && BACKEND=fastapi npm test` | Contract suite against this backend (starts it on `:8099` with `recipebook_test`) |
| `.venv/bin/python -m scripts.create_admin <email> <password> [name]` | Promote a user to admin, or create a new admin |
| `.venv/bin/python -m scripts.seed` | Demo data into an empty DB (`--reset` replaces users, recipes, reviews, likes). Same data as the Express seed |

Layout: `app/routers` → `app/services` (all DB queries) → `app/models` (Beanie Documents). Request and response shapes live in `app/schemas` (camelCase on the wire). Errors go through `app/core/errors.py`. See ADR-0008 for the parity rules.
