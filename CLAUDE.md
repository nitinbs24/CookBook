# Recipe Book — agent rules

Multi-user recipe sharing app (college NoSQL assignment). One React frontend, one MongoDB 7 in Docker, two interchangeable backends behind one API. Specs: `docs/PRD.md`, `docs/TRD.md`, `docs/DATABASE_SCHEMA.md`, `docs/UI_UX_BRIEF.md`. Decisions: `docs/decisions/`. Plan and progress: `tasks/plan.md`, `tasks/todo.md`.

## Layout

| Path | What |
|---|---|
| `db/init-db.js` | The only place collections, validators, indexes, and categories are created (ADR-0002) |
| `contract-tests/` | HTTP contract suite run against either backend (ADR-0004) |
| `backend-express/` | Express 5 + Mongoose 8 (Phase 1–3) |
| `frontend/` | React + Vite + Tailwind (Phase 4–6) |
| `e2e/` | Playwright smoke tests (Phase 6) |
| `backend-fastapi/` | FastAPI + Beanie 2 (Phase 7–9) |

## Commands

```bash
docker compose up -d                                                # MongoDB (wait for "healthy")
docker compose exec -T mongo mongosh recipebook /scripts/init-db.js # schema, indexes, categories
cd contract-tests && BACKEND=express npm test                       # contract suite (spawns the backend)
cd backend-express && npm test                                      # Express unit tests
cd backend-express && npm run dev                                   # Express API on :5000
```

More commands are added to `README.md` as each package lands.

## Rules

- **Work phase by phase.** Finish the phase gate in `tasks/plan.md`, report, then stop until the user says to move on.
- **Test first.** Write the failing contract or unit test, then the code. Never skip, delete, or weaken a test to get to green.
- **The contract suite is the spec.** A change to the API goes into `docs/TRD.md` §6 and `contract-tests/` first, then into both backends.
- **Stored fields are camelCase** in both stacks. The API returns `id`, never `_id`, and never `passwordHash`. No `__v`; no `_id` on embedded array items.
- **No indexes in models.** Mongoose `autoIndex:false`; Beanie declares none. Change `db/init-db.js` instead.
- **Queries live only in services.** Routes and controllers don't touch models directly.
- Register `/recipes/trending` before `/recipes/:id`.
- Recipe lists send "Both" as `foodType: {$in: ["veg","nonveg"]}` so the compound indexes serve the sort (DATABASE_SCHEMA §6.2). Check new list queries with `explain()`.
- Express controllers parse input with zod (`schema.parse(req.body)`); there's no validate middleware. Throw `httpError(status, code, message)` for API errors.
- Errors always use the shape `{ "error": { "code", "message" } }`, with the codes in TRD §6.1.
- **Ponytail (`/ponytail:ponytail`, level full) is the house style.** Make the smallest complete change. Use, in order: the platform, then installed deps, then minimal code. Add no deps beyond TRD §3 plus the test tools without a CHANGELOG justification. No wrappers or "for later" code. Never cut validation, auth, the delete cascade, accessibility, or tests. Run `/ponytail-review` on the phase diff before each phase commit.
- **Git:** commit directly on `main`, one commit per phase gate. No worktrees, no branches, no remote.
- Comments explain *why*, not *what*. Deliberate limits get `// shortcut: <limit>, <when to upgrade>`.
- Every phase updates `CHANGELOG.md`, keeps `README.md` and this file current, and writes the ADRs that phase names.

## Environment gotchas

- Docker Desktop must share `/mnt/CODE` (Settings → Resources → File sharing), or the `./db:/scripts` mount is refused. (Done on this machine.)
- Local Python is 3.14; the TRD targets 3.12. Settle this in Phase 7.
