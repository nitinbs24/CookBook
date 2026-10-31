# Recipe Book — Express backend

Express 5 + Mongoose 8. Serves `/api/v1` on `:5000`. Reads the repo-root `.env` (variables already set in the environment win).

| Command | What |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start with auto-reload (`node --watch`) |
| `npm start` | Start |
| `npm test` | Unit tests (Vitest); `createAdmin.test.js` needs Docker MongoDB running |
| `npm run test:contract` | Contract suite against this backend (starts it on `:5099` with `recipebook_test`) |
| `npm run create-admin -- <email> <password> [name]` | Promote a user to admin, or create a new admin |

Layout: `src/routes` → `src/controllers` (parse input with zod) → `src/services` (all DB queries) → `src/models`. Errors go through `src/middleware/errorHandler.js`.
