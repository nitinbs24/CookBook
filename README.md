# Recipe Book

A multi-user recipe sharing app. Users post recipes with step-by-step instructions, browse other people's recipes by main ingredient, filter everything by veg / non-veg, save recipes to "Want to try", and review them. An admin can see and delete any recipe.

It is built to demonstrate MongoDB (embedded arrays, references with `$lookup`, aggregation pipelines, text and compound indexes, schema validation) on **two interchangeable backends**: Express + Mongoose and FastAPI + Beanie, behind one React frontend.

> Status: Phase 4 done. The Express backend is complete. The frontend has its foundation (landing, auth, guest mode, navbar, theming); browsing and recipe pages come next. FastAPI is not built yet. See `tasks/todo.md` for progress.

## Quick start

Requires Docker, Node.js 22, and (from Phase 7) Python.

```bash
docker compose up -d                                                # start MongoDB 7
docker compose ps                                                   # wait for "healthy"
docker compose exec -T mongo mongosh recipebook /scripts/init-db.js # validators, indexes, categories (safe to re-run)
cp .env.example .env                                                # repo root; both backends read it. Fill in JWT_SECRET and Cloudinary keys
```

MongoDB listens on `mongodb://localhost:27017` (localhost only, no password; local development only). Connect MongoDB Compass to the same URL.

## Commands

| Where | Command | What |
|---|---|---|
| root | `docker compose up -d` / `down` / `down -v` | Start / stop / stop and delete all data |
| `backend-express/` | `npm install`, `npm run dev` | Express API on `:5000` (see [its README](backend-express/README.md)) |
| `backend-express/` | `npm test` / `npm run test:contract` | Unit tests / contract suite against Express |
| `backend-express/` | `npm run create-admin -- <email> <password> [name]` | Make the first admin |
| `backend-express/` | `npm run seed` (`-- --reset` to replace data) | Demo data: 6 users, 30 recipes, 100 likes, 50 reviews. All passwords `password123`; admin is `admin@recipebook.test` |
| `frontend/` | `npm install`, `npm run dev:express` (or `dev:fastapi`) | React app on `:5173`, talking to that backend |
| `frontend/` | `npm test` / `npm run build` | Component tests / production build |
| `contract-tests/` | `npm install` then `BACKEND=express npm test` | Run the API contract suite against a backend it starts itself |
| `contract-tests/` | `API_URL=http://localhost:5000/api/v1 npm test` | Run it against a server that is already running |

## Architecture

```
React (Vite) :5173 ──► /api/v1 ──► Express :5000  OR  FastAPI :8000 ──► MongoDB 7 (Docker)
                                         └──────── Cloudinary (images) ────────┘
```

| Decision | ADR |
|---|---|
| One frontend, two backends, one API contract | [0001](docs/decisions/0001-two-backends-one-contract.md) |
| `db/init-db.js` owns validators and indexes | [0002](docs/decisions/0002-init-script-owns-schema.md) |
| Document model: embed vs reference, stored counters, no transactions | [0003](docs/decisions/0003-document-model.md) |
| Shared HTTP contract test suite | [0004](docs/decisions/0004-shared-contract-test-suite.md) |
| Cloudinary with a test fake | [0005](docs/decisions/0005-cloudinary-with-test-fake.md) |
| JWT with a shared secret, role from the DB | [0006](docs/decisions/0006-jwt-shared-secret.md) |
| Desktop-only minimalist UI, CSS-variable tokens, dark mode | [0007](docs/decisions/0007-desktop-minimalist-ui.md) |

Specs: [PRD](docs/PRD.md) · [TRD](docs/TRD.md) · [Database schema](docs/DATABASE_SCHEMA.md) · [UI/UX brief](docs/UI_UX_BRIEF.md)

## Testing

- **Contract suite** (`contract-tests/`): HTTP tests run against either backend on the test database `recipebook_test`. It is the parity check between the two stacks.
- **Express unit tests** (`backend-express/test/`): validators, dish-name and regex helpers, model serialisation, and the `create-admin` script (which needs Docker MongoDB).
- **Index check:** `explain("executionStats")` in mongosh shows `IXSCAN` for the category page, home feed (both `veg`/`nonveg` and Both via `$in`), search, trending (`likes_createdAt`), Want to try, reviews, My recipes, and `likedByMe`. See `docs/DATABASE_SCHEMA.md` §5–6.
- **Frontend tests** (`frontend/src/**/*.test.js*`, Vitest + Testing Library): API client, auth / food-type / theme contexts, route guards, login and register forms, navbar.
- Playwright E2E arrives in Phase 6.
