# Recipe Book — Implementation Plan (phase-gated, TDD)

## Context

`docs/PRD.md`, `docs/TRD.md`, and `docs/DATABASE_SCHEMA.md` describe **Recipe Book**, a multi-user recipe sharing app for a college NoSQL assignment. It has one React + Vite frontend, one MongoDB 7 in Docker (`docker-compose.yml` and `db/init-db.js` already exist), and **two interchangeable backends** that serve the same 21-endpoint `/api/v1` contract: Express + Mongoose first, then FastAPI + Beanie.
The repo has no app code yet.

**What the user asked for**
- Build phase by phase, test-first (red, green, refactor). Run tests at the end of every phase, then **STOP and wait for "next phase"**.
- Finish the full MERN stack (backend, frontend, and E2E) before starting the Python stack.
- Write a UI/UX brief first. Minimalist theme, **desktop only**. This replaces PRD NFR-4 (usable at 360 px). The layout targets ≥1280 px wide.
- MongoDB runs only in Docker, from the existing compose file.

**Decisions from the interview**
- Images go to **Cloudinary**. In tests, `CLOUDINARY_FAKE=1` swaps in a fake uploader (no network).
- **One shared HTTP contract suite** (`contract-tests/`) is written once and run against `:5000` and `:8000`. It drives the Express TDD and is the parity check for NFR-1. Unit tests stay per stack (Vitest / pytest).
- Add a **Playwright E2E smoke** suite, run against each backend.
- Add **dark mode** (light/dark/system toggle).
- Plain JavaScript (no TypeScript), matching the TRD file names. No Postman collection, because the contract suite does that job.

## Deliverables written at the start of Phase 0 (after approval)
- `docs/UI_UX_BRIEF.md`: the brief below, expanded.
- `tasks/plan.md` and `tasks/todo.md`: this plan and a checkbox task list, as the planning skill requires.

---

## UI/UX brief (summary; full version goes to `docs/UI_UX_BRIEF.md`)

Source: the ui-ux-pro-max design-system search ("Minimalism & Swiss Style", Inter), adapted. I swapped the mint/green palette for neutral colours so the veg green dot stays meaningful.

| Area | Decision |
|---|---|
| Style | Swiss minimalism: white space, strict 12-column grid, hairline borders, no gradients or 3D, at most one subtle shadow (cards on hover) |
| Viewport | Desktop only. `min-width: 1280px` on body, content `max-w-[1200px]` centred, 4-column recipe card grid |
| Type | Inter 400/500/600/700. Scale 12/14/16/20/24/32/48. Body 16/1.5. Headings tight (−0.01em) |
| Light tokens | bg `#FFFFFF`, surface `#FAFAF9`, fg `#1C1917`, muted-fg `#57534E`, border `#E7E5E4`, primary `#1C1917` (white text), accent `#C2410C` (links, active like), destructive `#B91C1C`, veg `#15803D`, non-veg `#92400E` |
| Dark tokens | bg `#0C0A09`, surface `#1C1917`, fg `#FAFAF9`, muted-fg `#A8A29E`, border `#292524`, primary `#FAFAF9` (dark text), accent `#FB923C`, veg `#4ADE80`, non-veg `#F59E0B` |
| Theming | CSS variables on `:root` / `.dark`, mapped into Tailwind. `ThemeContext` (light/dark/system) stored in `localStorage.rb_theme`, toggle in the navbar |
| Icons | `lucide-react` SVG only, no emoji. Icon-only buttons get `aria-label` |
| Motion | CSS transitions only, 150–200 ms. Respect `prefers-reduced-motion`. No GSAP |
| Veg mark | Square outline with a filled dot (Indian food-label style) **plus** a text label "Veg" or "Non-veg" (never colour alone) |
| Screens | **Landing**: headline, short intro, 3 feature highlights, Sign up / Log in / Continue as guest (no testimonials, since there are none real). **Home**: Trending row, then category tile grid (5×2), then Latest + search. **Category**: title, dish-filter chip, card grid, pagination. **Recipe**: two columns (gallery and meta 7 cols, sticky ingredients 5 cols), instructions by section below, then reviews. **Form**: one long sectioned form with sticky "Save". **Admin**: two tabs (Recipes / Users), tables with search and pagination |
| Components | Navbar (logo, FoodType segmented toggle, theme toggle, auth menu), RecipeCard, CategoryTile, VegMark, LikeButton, ImageGallery, IngredientList, InstructionSections, ReviewList/Form, Pagination, ConfirmDialog, EmptyState, Skeleton |
| States | Skeleton loaders, empty states with a call to action, inline field errors under inputs, toast for API errors, guest prompt dialog (F-5) |
| A11y | Contrast ≥ 4.5:1 in both themes, visible focus ring (`ring-2` accent), labelled inputs, keyboard-reachable dialogs |

---

## Architecture notes (beyond the TRD)

- **Layout**: `frontend/`, `backend-express/`, `backend-fastapi/`, `contract-tests/`, `e2e/` (TRD §4, plus the two test packages).
- **Test DB**: tests use DB `recipebook_test` on the same Docker Mongo. `contract-tests` global setup does three things: (1) runs `docker compose exec -T mongo mongosh recipebook_test /scripts/init-db.js`, (2) spawns the chosen backend (`BACKEND=express|fastapi`) with `MONGODB_URI=…/recipebook_test`, `CLOUDINARY_FAKE=1`, and a test `JWT_SECRET`, (3) waits for `GET /api/v1/categories`. Before each test file it empties every collection except `categories`. Tests create an admin by updating `role` with the `mongodb` driver.
- **Contract suite files** (one per resource): `auth`, `categories`, `recipes`, `uploads`, `trending`, `likes`, `reviews`, `me`, `admin`, `errors`. They assert status codes, exact key sets (`id`, never `_id`; no `passwordHash`), pagination shape, and error shape.
- **Fake uploads**: when `CLOUDINARY_FAKE=1`, the upload service returns `{url:"https://fake.cloudinary.test/recipebook/<uuid>.jpg", publicId:"recipebook/<uuid>"}`, and image deletion is a no-op. This is the only switch.
- **Shared helpers** live once per backend in services: `ratingService.recompute(recipeId)` (§6.4) and `likeService.like/unlike` (§6.5). The seed script calls them too.
- **Scripts**: Express `dev`, `start`, `test` (Vitest unit), `test:contract`, `create-admin`, `seed`. FastAPI: `pytest`, then `contract-tests` with `BACKEND=fastapi`.

---

## Documentation (agent-skills: documentation-and-adrs)

The repo has no ADR convention yet. TRD §2 has a D1–D9 decision table, but no ADR files. So I use the skill's default: `docs/decisions/NNNN-kebab-title.md` with the headings Status / Date / Context / Decision / Alternatives Considered / Consequences. ADRs are never deleted. A changed decision gets a new ADR that supersedes the old one.

| ADR | Decision | Written in |
|---|---|---|
| 0001 | One React app, two interchangeable backends behind one `/api/v1` contract | P0 |
| 0002 | `db/init-db.js` owns validators and indexes (`autoIndex:false`, no Beanie indexes) | P0 |
| 0003 | Embed ingredients/steps/images; separate reviews and likes collections; stored counters; no transactions | P0 |
| 0004 | One shared HTTP contract test suite drives TDD and the parity check | P0 |
| 0005 | Cloudinary for images, with a `CLOUDINARY_FAKE` switch for tests | P0 |
| 0006 | JWT HS256 with a shared secret across both backends, role reloaded from the DB | P1 |
| 0007 | Desktop-only minimalist UI with CSS-variable tokens and a dark mode, replacing PRD NFR-4 | P4 |
| 0008 | Beanie 2 on PyMongo async, camelCase aliases, `PydanticObjectId` refs instead of `Link` | P7 |

Other documentation:
- **`CLAUDE.md`** (project root, P0): repo layout, commands, conventions (camelCase stored fields, `id` not `_id`, queries only in services, route order for `/trending`), a "contract suite must stay green" rule, and links to the ADRs. Updated whenever a convention changes.
- **`README.md`**: a P0 skeleton grown each phase, finished in P10. Sections: Quick Start (NFR-5), Commands table per package, Architecture with ADR links, switching backends, testing, `explain()` demo. `backend-express/README.md` and `backend-fastapi/README.md` get short run/test notes.
- **`CHANGELOG.md`**: one entry per phase (Added / Changed / Fixed).
- **API docs**: TRD §6 stays the contract source. The contract suite is its executable form. FastAPI's `/docs` is free. Express services get JSDoc (params, returns, thrown error codes) and FastAPI services get docstrings, on public service functions only.
- **Inline comments** explain the why and known gotchas only: the trending lookup limit of 30 then 10, the like insert-then-`$inc` ordering, 422 changed to 400, route order. No commented-out code and no stale TODOs. `shortcut:` comments for deliberate limits.
- Each doc gets a prose-review pass (the skill's three steps) before its phase gate.

## Phases

Each phase follows the same loop: write failing tests, implement until green, refactor, then run the **phase gate**, report, and **STOP**. **Every gate also includes:** the CHANGELOG entry is written, the README and CLAUDE.md are current, the phase's ADRs are written, and new service functions have JSDoc or docstrings.

### Phase 0: Foundation and harness
1. Write `docs/UI_UX_BRIEF.md`, `tasks/plan.md`, `tasks/todo.md`, root `.gitignore`, `.env.example` (TRD §12 names, plus `CLOUDINARY_FAKE`), `CLAUDE.md`, a README skeleton, `CHANGELOG.md`, and ADRs 0001–0005.
2. `docker compose up -d`, run `init-db.js` on `recipebook` and `recipebook_test`, and confirm `db.recipes.insertOne({title:"x"})` is rejected.
3. Scaffold `contract-tests/` (Vitest, `mongodb` driver, global setup as above) with one failing `GET /categories` test. This is RED until Phase 1.

**Gate:** container healthy, validator rejects the bad insert, the harness runs and reports the expected failure.

### Phase 1: Express foundation and auth
- `backend-express` skeleton: `config/` (env, db with `autoIndex:false`), models (User, Category, Recipe, Review, Like with `versionKey:false`, `_id:false` sub-schemas, and a `toJSON` transform that maps `_id` to `id` and drops `passwordHash`), `errorHandler` (zod→400, 11000→409, CastError→404, else 500), `validate` middleware, zod validators (TRD §9).
- Auth: register, login, me. bcrypt cost 12, JWT HS256 valid 7 days, `requireAuth`, `optionalAuth`, `requireAdmin` (user reloaded from DB on every request). Plus the `create-admin` script and `GET /categories` (aggregation §6.1).
- Tests: contract `auth`, `errors`, `categories` (empty to start). Unit tests for the zod validators and the `toJSON` transform.

**Gate:** `npm test` and `npm run test:contract` (auth, errors, categories) green.

### Phase 2: Express recipes
- `POST /uploads` (multer memory, 5 MB, JPEG/PNG/WebP, Cloudinary stream or fake).
- Recipe CRUD: the server sets author, counters, and timestamps; checks the category exists; normalises `dishName`; only the owner can PUT.
- `GET /recipes` with `q` (text index), `foodType`, `category`, `dish` (escaped, case-insensitive), pagination, newest first, and one batched author lookup.
- `GET /recipes/trending` (§6.3, registered before `/:id`). `GET /recipes/:id` with `likedByMe`.
- Tests: contract `recipes`, `uploads`, `trending`, and `categories` counts under the foodType filter. Unit tests for the regex escape and dishName normaliser.

**Gate:** all contract files so far green. `explain()` shows IXSCAN for the category list and search queries.

### Phase 3: Express likes, reviews, me lists, admin, seed
- Like/unlike (exact counts, idempotent), `GET /me/likes` (§6.6 with foodType), `GET /me/recipes`.
- Reviews: list, create (403 on own recipe, 409 on duplicate), delete by owner or admin, rating recomputed (§6.4).
- `DELETE /recipes/:id` cascade (reviews, likes, recipe, images) for owner or admin.
- Admin: recipes (with `author.email` and `q`), users with `recipeCount` (§6.7), and one user's recipes. All return 403 for non-admins.
- `seed` script: about 6 users, 30 recipes, 100 likes over 14 days, 50 reviews, counters set through the shared helpers. Use placeholder image URLs that need no upload.
- Tests: contract `likes`, `reviews`, `me`, `admin`, and the cascade.

**Gate:** **the full contract suite is green against Express.** Seed runs cleanly, and trending explain shows IXSCAN on `likes_createdAt`.

### Phase 4: Frontend foundation
- Vite, React, React Router, Axios, Tailwind, `lucide-react`. Design tokens from the brief, Inter font, dark mode.
- `api/client.js` (`VITE_API_URL`, Bearer token, error normalising). `.env.express` and `.env.fastapi`, with `dev:express` and `dev:fastapi` scripts.
- `AuthContext` (token, user, isGuest; `rb_token` / `rb_guest`), `FoodTypeContext` (`rb_foodType`), `ThemeContext`.
- Pages: Landing (redirects to `/home` if there is a token or guest flag), Login, Register, Continue as guest. Navbar with FoodType and theme toggles, `ProtectedRoute`, `AdminRoute`, guest prompt dialog.
- Tests (Vitest + React Testing Library, API mocked at the client boundary): context persistence, route guards, form validation errors, toggle behaviour.

**Gate:** `npm test` and `npm run build` green. Manual check against Express: register, log in, log out, guest, and a refresh keeps the state.

### Phase 5: Frontend browsing and recipe page
- Home (Trending, category tiles hidden when the count is 0, Latest + search, paginated), Category page (dish filter chip), RecipeDetail (gallery, details, ingredients, sectioned instructions, LikeButton with optimistic update and revert, reviews list and form, owner Edit/Delete, admin delete on reviews).
- Every list refetches when the foodType changes.
- Tests: RecipeCard and VegMark rendering, LikeButton optimistic revert on failure, ReviewForm validation and guest prompt, foodType change triggers a refetch.

**Gate:** unit tests and build green. Manual run of PRD flows 2, 3, and 5 against the seeded Express data, in both themes.

### Phase 6: Frontend contribute, my lists, admin, E2E (MERN complete)
- RecipeForm (create and edit with prefill; dynamic ingredient, section, and step rows; uploads 1–3 images first; inline errors), delete with ConfirmDialog, MyRecipes, WantToTry, Admin (Recipes and Users tabs, search, pagination, per-user recipes, delete).
- `e2e/` Playwright smoke tests: guest browse, sign up and add a recipe (fake upload), like it and see it in Want to try, review as another user, admin deletes it.
- Tests: RecipeForm row add/remove and validation; Admin tab and table rendering.

**Gate:** frontend tests, build, full contract suite, and Playwright **against Express** all green. **This finishes the MERN stack.**

### Phase 7: FastAPI foundation and auth
- `backend-fastapi`: `core/` (pydantic-settings config, `AsyncMongoClient` + `init_beanie`, security, errors with 422 changed to 400), Beanie Documents (camelCase alias generator, `PydanticObjectId` refs, manual timestamps, no indexes), `CamelModel` / `Page[T]` response schemas, `deps.py`, auth routers, categories, `create_admin.py`.
- Tests: pytest for security helpers and schemas. Contract `auth`, `errors`, `categories` with `BACKEND=fastapi`. Check in Compass/mongosh that stored fields are camelCase (`prepTimeMin`).

**Gate:** pytest and the matching contract files green on `:8000`. A token issued by Express works on FastAPI.

### Phase 8: FastAPI recipes
- Uploads (`UploadFile`, same limits, same fake switch), recipe CRUD, lists and filters, trending. These are line-by-line ports of the Express services.

**Gate:** contract `recipes`, `uploads`, `trending`, `categories` green on `:8000`.

### Phase 9: FastAPI likes, reviews, me, admin, seed (Python complete)
- The rest of the endpoints, the cascade, and `seed.py`.

**Gate:** **full contract suite green on both `:5000` and `:8000`.** Playwright passes with `dev:fastapi`. The two backends can read each other's documents (seed with one, browse with the other).

### Phase 10: Polish
- Check loading, empty, and error states everywhere. Write a README covering setup (NFR-5: `docker compose up -d`, init-db, one command per app), switching backends, running every test suite, and `explain()` demo commands. Add screenshots.

**Gate:** a fresh-clone dry run following the README, with every suite green.

---

## Verification (per gate, commands)
- DB: `docker compose ps` healthy; `docker compose exec mongo mongosh recipebook /scripts/init-db.js`
- Express unit: `cd backend-express && npm test`
- Contract: `cd contract-tests && BACKEND=express npm test` (or `BACKEND=fastapi`)
- FastAPI unit: `cd backend-fastapi && pytest`
- Frontend: `cd frontend && npm test && npm run build`
- E2E: `cd e2e && BACKEND=express npx playwright test`
- Index check: `explain("executionStats")` on the category, search, and trending queries shows `IXSCAN`

## Risks
| Risk | Mitigation |
|---|---|
| Mongoose and Beanie drift on field names or nulls | Strict `$jsonSchema` validator plus a contract suite that checks key sets; a cross-read check in Phase 9 |
| Beanie 2 API differs from tutorials | Follow the current Beanie docs (TRD D9) |
| Cloudinary keys missing at demo time | Tests never need them. The real-upload manual check needs keys in `.env` before Phase 6 |
| Flaky contract tests from shared DB state | Wipe collections before each file and run files serially (`fileParallelism: false`) |

## Git
Work in a worktree branch, commit at the end of each phase, and never push to main.
