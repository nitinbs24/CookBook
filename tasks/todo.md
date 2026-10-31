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
- [ ] Contract tests: `errors` (unknown route, error shape), `auth` (register / login / me, 400 / 401 / 409), `categories` (empty → `[]`)
- [ ] Unit tests: zod validators, `toJSON` transform
- [ ] Config, db (`autoIndex:false`), five models, errorHandler, validate middleware
- [ ] Auth service and routes, `requireAuth` / `optionalAuth` / `requireAdmin`, `create-admin` script
- [ ] `GET /categories` aggregation (§6.1)
- [ ] ADR-0006 (JWT)
- [ ] **Gate:** `npm test` and contract files auth / errors / categories green

## Phase 2: Express recipes
- [ ] Contract tests: `uploads`, `recipes` (CRUD, filters, search, pagination, owner checks), `trending`, `categories` counts
- [ ] Unit tests: regex escape, dishName normaliser
- [ ] Upload service (multer, Cloudinary, fake), recipe service and routes, trending
- [ ] **Gate:** contract files so far green; `explain()` IXSCAN on the category and search queries

## Phase 3: Express likes, reviews, me, admin, seed
- [ ] Contract tests: `likes`, `reviews`, `me`, `admin`, delete cascade
- [ ] Like / review / admin services and routes, cascade, rating recompute
- [ ] Seed script
- [ ] **Gate:** full contract suite green on Express; seed OK; trending IXSCAN

## Phase 4: Frontend foundation
- [ ] Vite + React + Tailwind tokens + dark mode; api client; Auth / FoodType / Theme contexts
- [ ] Landing, Login, Register, guest mode, Navbar, route guards, guest prompt
- [ ] RTL tests: contexts, guards, form errors, toggle
- [ ] ADR-0007 (UI)
- [ ] **Gate:** `npm test` and build green; manual auth and guest check against Express

## Phase 5: Frontend browsing and recipe page
- [ ] Home, Category, RecipeDetail (gallery, ingredients, instructions, like, reviews, owner controls)
- [ ] RTL tests: cards, VegMark, optimistic like revert, review form, refetch on toggle
- [ ] **Gate:** tests and build green; PRD flows 2, 3, and 5 manually checked in both themes

## Phase 6: Frontend contribute, lists, admin, E2E (MERN complete)
- [ ] RecipeForm (create / edit), delete confirm, MyRecipes, WantToTry, Admin
- [ ] RTL tests: form rows and validation, admin tables
- [ ] Playwright smoke suite against Express
- [ ] **Gate:** all frontend, contract, and E2E suites green against Express

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
