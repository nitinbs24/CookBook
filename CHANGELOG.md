# Changelog

All notable changes, one entry per build phase.

## [Phase 2] - 2026-10-31
### Added
- `POST /uploads`: multer (memory, 5 MB, JPEG/PNG/WebP) streaming to Cloudinary `recipebook/`, or a fake URL when `CLOUDINARY_FAKE=1`.
- `POST /recipes`, `PUT /recipes/:id` (author only), and `GET /recipes/:id` (with `likedByMe` through `optionalAuth`; a bad token counts as a guest). The server sets author, counters, and timestamps, checks the category slug exists, stores optional fields as `null`, and stores `dishName` trimmed with single spaces.
- `GET /recipes`: cards, newest first, paginated (`limit` 1–50), filters `foodType`, `category`, and `dish` (exact, case-insensitive, regex-escaped), plus `q` text search sorted by relevance. Author names come from one batched query.
- `GET /recipes/trending` (DATABASE_SCHEMA §6.3): cards plus `weekLikes`, with `days` and `limit`.
- Category and Like models. Contract tests: `uploads` (7), `recipes` (28), `recipes-list` (14), `trending` (5). Unit tests: `normalizeDish`, `escapeRegex`, `recipeSchema`, list and trending queries (8).
- Dependencies: `multer`, `cloudinary` (both in TRD §3).
### Changed
- Recipe lists send "Both" as `foodType: {$in: ["veg","nonveg"]}`. `explain()` showed that leaving the field out made the home feed scan the whole collection and sort in memory. The new form merges two index scans (documented in DATABASE_SCHEMA §6.2).
- From the ponytail review: recipe images must be `https` with a `publicId` in `recipebook/`, so a later recipe delete can't destroy files outside our folder. Phase 3 will also skip images another recipe still uses.
### Verified
- One real upload to Cloudinary through the API (201, `res.cloudinary.com/.../recipebook/...`), then deleted.

## [Phase 1] - 2026-10-31
### Added
- `backend-express/`: Express 5 + Mongoose 8 app with config, User and Recipe models, an error handler that maps errors to the TRD shape, and zod validators.
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (bcrypt cost 12, JWT HS256 valid 7 days, role reloaded from the DB) and `GET /categories` (the §6.1 aggregation, with the `foodType` filter).
- `npm run create-admin -- <email> <password> [name]`.
- Contract tests: `auth` (17, including a forged-token check), `errors` (3), `categories` (5 with counts and filters). Unit tests: validators, User `toJSON` (9).
- ADR-0006 (JWT).
### Changed
- From the ponytail review: the JSON body limit is 1 MB (a max-size recipe is ~150 KB), startup fails if `JWT_SECRET` is under 32 characters, and `create-admin` says when a promoted user keeps their old password.
- `create-admin` test (`backend-express/test/createAdmin.test.js`): creates, promotes without changing the password, and rejects bad input (3 tests).
- Ponytail: Node's built-in `process.loadEnvFile` and `node --watch` replace `dotenv` and `nodemon`; `morgan` is skipped (nothing needs request logs yet). `optionalAuth`, `requireAdmin`, and the Review and Like models wait until a route uses them (Phases 2–3).

## [Phase 0] - 2026-10-31
### Added
- UI/UX brief (`docs/UI_UX_BRIEF.md`): desktop-only minimalist design, light and dark tokens, components, and screens.
- ADRs 0001–0005 in `docs/decisions/`.
- `CLAUDE.md`, `README.md`, `tasks/plan.md`, `tasks/todo.md`, `.env.example`, `.gitignore`.
- `contract-tests/` harness: starts a backend on `recipebook_test`, resets the data before each file, and holds the first contract test (`GET /categories`), which fails until Phase 1.
- `.claude/settings.json` (`worktree.bgIsolation: none`): work happens directly on `main`.
### Changed
- `CLAUDE.md`: ponytail (level full) is the house style; commit on `main`.
- `contract-tests` uses Vitest 5.0.5 with a workaround in `global-setup.js` for its crash when printing setup errors (Vitest 4 would not install because of an npm resolver error).
### Verified
- MongoDB healthy; `init-db.js` applied to `recipebook` and `recipebook_test` (10 categories, 5 recipe indexes, safe to re-run).
- `db.recipes.insertOne({title:"x"})` is rejected with "Document failed validation".
- Contract suite runs and fails as expected (RED): `ECONNREFUSED :5099`, since there is no backend yet.
