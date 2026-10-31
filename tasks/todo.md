# Recipe Book — task list

Rules: test first (red, green, refactor). Each phase ends with its gate, then **stop until the user says "next phase"**. Every gate also includes: a CHANGELOG entry, README and CLAUDE.md current, the phase's ADRs written, and JSDoc or docstrings on new service functions. Full detail: `tasks/plan.md`.

## Phase 0: Foundation and harness
- [x] UI/UX brief `docs/UI_UX_BRIEF.md` (tokens contrast-checked)
- [x] ADRs 0001–0005, `CLAUDE.md`, README skeleton, `CHANGELOG.md`, `.gitignore`, `.env.example`, `tasks/`
- [x] MongoDB up and healthy; `init-db.js` applied to `recipebook` and `recipebook_test`
- [x] Validator rejects `db.recipes.insertOne({title:"x"})`
- [x] `contract-tests/` harness with the first failing test (`GET /categories` → 200 `[]`)
- [x] **Gate:** container healthy, validator rejects, harness runs and fails as expected (RED)

## Phase 1: Express foundation and auth
- [x] Contract tests: `errors` (unknown route, malformed JSON, CORS), `auth` (register / login / me, 400 / 401 / 409), `categories` (empty, counts, filters)
- [x] Unit tests: zod validators, User `toJSON` transform
- [x] Config (root `.env` via `process.loadEnvFile`), db (`autoIndex:false`), User and Recipe models, errorHandler
- [x] Auth service, controllers, routes, `requireAuth`, `create-admin` script
- [x] `GET /categories` aggregation (§6.1)
- [x] ADR-0006 (JWT)
- [x] **Gate:** `npm test` (9) and contract suite (27) green; ponytail review findings 1–4 fixed
- Moved to the phase that first uses them: `optionalAuth` (P2), `requireAdmin` and the Review / Like models (P3)

## Phase 2: Express recipes
- [x] Contract tests: `uploads`, `recipes` (CRUD, owner checks, validation), `recipes-list` (filters, search, pagination), `trending`
- [x] Unit tests: regex escape, dishName normaliser, recipe schema, list and trending queries
- [x] Upload service (multer, Cloudinary, fake), recipe service and routes, trending, `optionalAuth`
- [x] **Gate:** unit (20) and contract (81) green; ponytail review fixes applied; `explain()` IXSCAN for the category, home (including Both), and search queries; one real Cloudinary upload checked

## Phase 3: Express likes, reviews, me, admin, seed
- [x] Contract tests: `likes`, `reviews`, `me`, `admin`, `recipes-delete` (cascade)
- [x] Like / review / admin services and routes, cascade, rating recompute, `requireAdmin`
- [x] Cascade deletes only Cloudinary images no other recipe references (from the Phase 2 review)
- [x] Seed script
- [x] **Gate:** full contract suite (124) and unit tests (22) green on Express; seed OK, counters verified; trending IXSCAN on `likes_createdAt`

## Phase 4: Frontend foundation
- [x] Vite + React + Tailwind tokens + dark mode; api client; Auth / FoodType / Theme contexts
- [x] Landing, Login, Register, guest mode, Navbar, route guards
- [x] RTL tests: client, contexts, guards, form errors, toggles (35)
- [x] ADR-0007 (UI)
- [x] **Gate:** `npm test` (35) and build green; ponytail review fixes applied; API side of the auth flow checked against Express. A browser click-through by the owner is pending.
- Moved to Phase 5: guest prompt dialog and toast (first used by like / review)

## Phase 5: Frontend browsing and recipe page
- [x] Home, Category, RecipeDetail (gallery, ingredients, instructions, like, reviews, delete for author/admin)
- [x] Guest prompt dialog, toast, `useAsync` (moved here from Phase 4)
- [x] RTL tests: cards, VegMark, optimistic like revert, review form, refetch on toggle, search vs Back, pages (60 total)
- [x] **Gate:** tests and build green; PRD flows 2, 3, and 5 checked in headless Chromium against seeded Express data, in both themes; ponytail review fixes applied
- Moved to Phase 6: Edit button on the recipe page (lands with the form)

## Phase 6: Frontend contribute, lists, admin, E2E (MERN complete)
- [x] RecipeForm (create / edit), Edit button, MyRecipes, WantToTry, Admin, navbar account menu
- [x] RTL tests: form logic and rows, validation, uploads, my lists, admin tables, navbar menu (103 total)
- [x] Playwright smoke suite against Express (6 tests)
- [x] **Gate:** frontend (103), Express unit (22), contract (124), and E2E (6) green against Express; build green; screens checked by screenshot; ponytail review fixes applied

## Phase 7: FastAPI foundation and auth
- [ ] Core, models (camelCase), schemas, deps, auth, categories, `create_admin.py`
- [ ] pytest units; contract auth / errors / categories with `BACKEND=fastapi`
- [ ] ADR-0008 (Beanie)
- [ ] **Gate:** green on `:8000`; camelCase confirmed in the DB; an Express token works on FastAPI

## Phase 8: FastAPI recipes
- [ ] Uploads, recipe CRUD, lists and filters, trending
- [ ] **Gate:** contract recipes / uploads / trending / categories green on `:8000`

## Phase 9: FastAPI likes, reviews, me, admin, seed (Python complete)
- [ ] Remaining endpoints, cascade, `seed.py`
- [ ] **Gate:** full contract suite green on both backends; Playwright with `dev:fastapi`; cross-read check

## Phase 10: Polish
- [ ] Loading, empty, and error states; final README; screenshots
- [ ] **Gate:** fresh-clone dry run following the README, every suite green
