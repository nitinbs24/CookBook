# Changelog

All notable changes, one entry per build phase.

## [Phase 8] - 2026-10-31
### Added
- FastAPI recipes, ported from the Express services:
  - `POST /uploads` (`UploadFile`: type checked, reads at most 5 MB + 1 byte, Cloudinary through a threadpool, or fake with `CLOUDINARY_FAKE=1`)
  - `POST /recipes`, `PUT /recipes/{id}` (author only), and `GET /recipes/{id}` with `likedByMe` (`get_optional_user`)
  - `GET /recipes` (filters, escaped case-insensitive dish match, `$text` search, "Both" as `$in`, pagination)
  - `GET /recipes/trending`
- `RecipeIn` mirrors the zod rules: strict integers, null-filled optionals, the dish name normaliser, and `https` + `recipebook/` images. Card, full, detail, and trending response schemas, a generic `Page[T]`, and a `Like` document.
- Dependencies: `python-multipart`, `cloudinary` (TRD §3).
- 18 pytest tests for the recipe schema (38 in total).
### Changed
- From the ponytail review: `PUT /recipes/{id}` uses `$set` on the editable fields only. Beanie's `save()` replaced the whole document, so a like or review landing mid-edit would have been overwritten in the counters. Ingredient `quantity` is strict (rejects `"1.5"` strings, like zod). Admin-only card pieces are removed until Phase 9 uses them.
### Verified
- Contract `uploads`, `recipes`, `recipes-list`, `trending`, and `categories` (59) pass on FastAPI, unchanged. The full suite on FastAPI is 84/124, and every failure is a Phase 9 endpoint. Express is still 124/124.
- Cross-backend, on one database:
  - the same recipe created through each backend gives identical POST responses and identically shaped stored documents (keys, types, nulls, no embedded `_id`)
  - `GET /recipes/:id` is identical from both backends for a recipe made by either
  - each backend can edit the other's recipes, and dish-filtered lists match
- One real Cloudinary upload through FastAPI, then deleted.

## [Phase 7] - 2026-10-31
### Added
- `backend-fastapi/` (Python 3.12, FastAPI 0.162, Beanie 2.2 on PyMongo 4.19 async):
  - `core`: settings from the root `.env` (`JWT_SECRET` must be 32+ characters), DB init, security, and errors (422→400, 404/405→404, duplicate key→409, else 500, all in the TRD shape).
  - Beanie `User` and `Recipe` with camelCase aliases; `CamelModel` response schemas with Express-identical dates.
  - `get_current_user`, `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `GET /categories`, and `scripts/create_admin.py`.
- Contract tests `auth`, `errors`, and `categories` (27) pass on FastAPI, unchanged. 20 pytest tests: security, schemas, error handling, and the `create_admin` script.
- ADR-0008.
### Fixed
- A plain camelCase alias generator renamed Beanie's `id` (stored as `_id`), so users loaded from MongoDB had `id: None`. Caught by the contract suite; one shared alias function now keeps `_id`.
- `create_admin` with no name argument passed `None` as the name. Caught by its new test.
- From the ponytail review: unexpected errors are caught in a middleware inside CORS, so a 500 reaches the browser with CORS headers (Starlette's `Exception` handler runs outside the middleware stack). `Recipe` timestamps have no separate defaults, which would differ by microseconds; the service will set both from one clock reading. `httpx` added for FastAPI's TestClient.
### Verified
- Cross-backend, on one database: a FastAPI-registered user logs in on Express and the reverse, an Express token works on FastAPI `/auth/me` with an identical `createdAt` string, and stored users have identical keys (`_id, createdAt, email, name, passwordHash, role`; no `revisionId`; `$2b$12$` hashes from both).

## [Phase 6] - 2026-10-31
### Added
- Recipe form (`/recipes/new`, `/recipes/:id/edit`): photos (uploaded on pick; type and 5 MB checked first; the first photo is the cover; removable), basics, ingredient rows, instruction sections with steps (add and remove, with the TRD limits), and a sticky Save. Client validation mirrors TRD §9 with errors under each field, and focus moves to the first error. Server `VALIDATION_ERROR`s land on the field their path names. Editing someone else's recipe is refused.
- My recipes (`/me/recipes`) and Want to try (`/me/likes`): paginated, follow the toggle, with empty states that link to the next step.
- Admin (`/admin`): a Recipes tab (search by title, table with author email, delete with confirmation) and a Users tab (role, recipe count, joined date; click a user to see their recipes).
- Navbar: Add recipe, and an account menu (native `<details>`) with My recipes, Want to try, Admin (admins only), and Log out. An Edit button on the recipe page for its author.
- `e2e/`: Playwright suite (6 tests) against a backend it starts itself, on `recipebook_e2e`, reseeded every run.
- Component tests: 103 in total (form logic, form page, my lists, admin, navbar menu, categories).
### Fixed
- Logging out from a protected page (e.g. Want to try) landed on /login instead of the landing page. React Router navigates inside a transition, so the cleared token rendered first. Both now happen in one transition. Found by E2E, with a unit test added first.
### Changed
- From the ponytail review:
  - orphaned uploads are documented as a `shortcut:` and in the README
  - form errors clear when rows are added or removed
  - Cancel goes to the recipe or to Home instead of history Back
  - the admin table keeps its page links when a page becomes empty
  - the account menu closes on Escape
  - removed a no-op route `key`
- Category names come from one list (`lib/categories.js`), so "Rice & Biryani" keeps its ampersand. The Category page no longer fetches `/categories` just to show its own name.

## [Phase 5] - 2026-10-31
### Added
- Home: Trending this week (a scroll strip with buttons), category tiles with counts (hidden at 0 by the API), and latest recipes with a debounced search (`?q`) and pagination (`?page`). Every list refetches when the veg / non-veg toggle changes.
- Category page `/category/:slug`: breadcrumb, count, a dish filter chip from `?dish` (clearable), and a paginated card grid.
- Recipe page `/recipes/:id`: gallery with thumbnails, VegMark and category chip, stats, ingredients (sticky), sectioned steps with durations and tips, an optimistic LikeButton that reverts with a toast on failure, reviews (star radio group, comment, "You reviewed this", delete by the reviewer or an admin), delete recipe for the author or an admin, and a "Recipe not found" page.
- Shared pieces: native `<dialog>` (`Dialog`, `ConfirmDialog`, `GuestPrompt` for PRD F-5), `ToastProvider`, `useAsync`, `RecipeCard` (stretched link with a separate dish link, so there are no nested anchors), `VegMark`, `Rating`, `CategoryTile`, `Pagination`, empty / error / skeleton states.
- 60 component tests (25 new).
### Changed
- Seed photos now come from TheMealDB (real dishes, with a vegetarian photo for veg recipes in mixed categories) instead of random picsum.photos images. The seed's "a easy" now reads "an easy".
- From the ponytail review: the search box follows `?q` on browser Back (the debounce used to re-apply the old search), clicks inside a dialog's padding no longer close it, and pagination stays visible on a page past the end.
- RecipeCard puts the author on its own line, and VegMark never wraps (found in a headless-browser screenshot review).
### Verified
- A Playwright run in headless Chromium against Express and the seed data covered PRD flows 2, 3, and 5:
  - guest browse, reload, the veg toggle hiding Chicken, search, dark mode, category, dish filter, and the recipe page
  - the guest like prompt and closing it with Escape
  - login, like and unlike, posting and deleting a review with the rating recomputed, author-only controls, and the not-found page
- No console errors, no 5xx responses. Every test change was undone.
- Not built yet: the Edit button (Phase 6, with the form).

## [Phase 4] - 2026-10-31
### Fixed
- The Vite dev server binds `127.0.0.1`. Its default `localhost` bound only IPv6 `[::1]`, so IPv4-first browsers reported "page can't be reached".
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
