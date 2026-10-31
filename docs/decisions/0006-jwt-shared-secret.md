# ADR-0006: JWT HS256 with one secret shared by both backends; role reloaded from the DB

## Status
Accepted

## Date
2026-10-31

## Context
Users log in once and the frontend may talk to either backend (ADR-0001). Auth must be stateless (no session store in the single Mongo container), passwords must be hashed (NFR-3), and admin rights must take effect without waiting for a token to expire.

## Decision
- Passwords are hashed with bcrypt at cost 12 (`bcryptjs` in Express, `bcrypt` in FastAPI; both read each other's `$2a$`/`$2b$` hashes).
- `/auth/register` and `/auth/login` return a JWT signed with **HS256**, payload `{ sub: userId, role }`, valid for **7 days**. Both backends use the same `JWT_SECRET` from the one root `.env`, so a token from either works on the other.
- On every authenticated request the server verifies the token (HS256 only), then **loads the user by `sub`**. A missing user means 401. The role used for checks is the one in the database; the `role` claim is informational only.
- Login returns one generic 401 ("Email or password is incorrect") for both an unknown email and a wrong password. For an unknown email it still runs a bcrypt compare against a dummy hash, so the two cases take the same time.
- Passwords are limited to 8–72 characters, because bcrypt ignores everything past 72 bytes.
- The frontend keeps the token in `localStorage` (`rb_token`) and sends `Authorization: Bearer <token>`.

## Alternatives Considered

### Server-side sessions (cookie + session store)
- Pros: instant logout and revocation.
- Cons: a shared session store between Node and Python; CSRF handling.
- Rejected: too much shared infrastructure for two interchangeable backends.

### Trust the role in the token
- Pros: no DB read per request.
- Cons: a demoted admin keeps admin rights for up to 7 days, and a promoted user must log in again.
- Rejected: one indexed `findById` per request is cheap at this scale.

### httpOnly cookie instead of localStorage
- Pros: not readable by injected scripts.
- Cons: needs CSRF protection and cross-origin cookie setup between `:5173` and two API ports.
- Rejected for this local assignment. React escapes output by default, which limits the XSS risk to localStorage.

## Consequences
- There is no server-side logout: logging out deletes the token in the browser, and a stolen token works until it expires.
- Changing `JWT_SECRET` logs everyone out on both backends.
- Deleting a user makes their token useless on the next request.
