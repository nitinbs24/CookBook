# Changelog

All notable changes, one entry per build phase.

## [Phase 1] - 2026-10-31
### Added
- `backend-express/`: Express 5 + Mongoose 8 app with config, User and Recipe models, an error handler that maps errors to the TRD shape, and zod validators.
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (bcrypt cost 12, JWT HS256 valid 7 days, role reloaded from the DB) and `GET /categories` (the §6.1 aggregation, with the `foodType` filter).
- `npm run create-admin -- <email> <password> [name]`.
- Contract tests: `auth` (17, including a forged-token check), `errors` (3), `categories` (5 with counts and filters). Unit tests: validators, User `toJSON` (9).
- ADR-0006 (JWT).
### Changed
- From the ponytail review: the JSON body limit is 1 MB (a max-size recipe is ~150 KB), startup fails if `JWT_SECRET` is under 32 characters, and `create-admin` says when a promoted user keeps their old password.
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
