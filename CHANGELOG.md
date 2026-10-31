# Changelog

All notable changes, one entry per build phase.

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
