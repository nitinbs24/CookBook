# Changelog

All notable changes, one entry per build phase.

## [Phase 4] - 2026-10-31
### Added
- `frontend/`: React 19 + Vite 8 + Tailwind 4 + React Router 7. The design tokens from the UI brief are CSS variables with a dark theme, using the Inter font. `npm run dev:express` and `dev:fastapi` pick the backend through `.env.express` and `.env.fastapi`.
- `src/api/client.js` (axios with a Bearer token interceptor; errors become `ApiError {status, code, message}`) and `src/api/auth.js`.
- Contexts:
  - `AuthContext`: token in `rb_token` and guest flag in `rb_guest`. The user is reloaded on start; only a 401 logs out, and a network failure keeps the session.
  - `FoodTypeContext`: `rb_foodType`, with `apiFoodType` (no param for Both).
  - `ThemeContext`: light, dark, or system in `rb_theme`. An inline script applies it before first paint.
- Route guards: `SessionRoute` (/home needs a token or the guest flag), `ProtectedRoute` (logged-in users, redirects to /login and back), `AdminRoute`.
- Pages: Landing (redirects returning users), Login, Register (inline field errors with `aria-describedby`, server 409 shown on the email field), Home (a placeholder until Phase 5), and Not found. The Navbar has a radio-based veg / non-veg toggle and a theme toggle.
- 35 component tests. ADR-0007.
### Changed
- From the ponytail review: the danger button text uses the `bg` token (white on dark-mode red was 2.77:1), and Register shows server field errors under the field they name.
- Ponytail: the guest-prompt dialog, the toast, and the navbar's Add recipe / My recipes / Admin links are added with the pages that use them (Phases 5–6).
### Verified
- `npm run build` passes. Against the running Express API, Vite serves the app with `VITE_API_URL`, the CORS preflight from `:5173` is allowed (including `Authorization`), and register, me, and login work with seeded data. The click-through in a real browser is left to the owner (the agent's browser can't reach localhost).

## [Phase 3] - 2026-10-31
### Added
- Likes: `POST`/`DELETE /recipes/:id/like`. They're idempotent: the unique index plus `$inc` only after a real insert or delete keeps the count exact, even with 5 parallel likes.
- `GET /me/likes` (Want to try, newest like first, `foodType`) and `GET /me/recipes` (`foodType` added per PRD F-11).
- Reviews: list, create (403 on your own recipe, 409 on a duplicate), and delete by the reviewer or an admin. `avgRating` (1 decimal) and `reviewCount` are recomputed after each change.
- `DELETE /recipes/:id` (author or admin) deletes the recipe's reviews, then its likes, then the recipe, then any Cloudinary images no other recipe references.
- Admin: `GET /admin/recipes` (with `author.email` and `q`), `/admin/users` (with `recipeCount`), and `/admin/users/:id/recipes`, all behind `requireAdmin`.
- `npm run seed`: 6 users, 30 recipes, 100 likes, 50 reviews, using the API's own counter helpers. It refuses to touch a non-empty DB without `--reset`.
- Contract tests: `likes` (6), `me` (7), `reviews` (17), `recipes-delete` (4), `admin` (9); 124 in total. Unit test: `unusedPublicIds` (2).
### Changed
- The recipe service's `cardPage()` now builds every recipe-card list (home, category, search, My recipes, admin).
- TRD §6.2: `/me/recipes` accepts `foodType`.
- From the ponytail review: ADR-0003 and `deleteRecipe` now describe the real partial-failure outcome (stale counters, fixed by deleting again), and the seed prints which database it writes to.
### Verified
- `explain()` shows IXSCAN on the seeded data for trending (`likes_createdAt`), Want to try, the review list, My recipes, the admin recipe count, and `likedByMe`.

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
