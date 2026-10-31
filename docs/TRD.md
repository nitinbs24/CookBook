# Recipe Book — Technical Requirements Document (TRD)

| | |
|---|---|
| **Status** | v2 (slimmed) — 31 Oct 2026 |
| **Implements** | `PRD.md` |
| **Data layer** | `DATABASE_SCHEMA.md`, `db/init-db.js` |
| **Local infra** | `docker-compose.yml` (MongoDB 7) |

---

## 1. Scope

How Recipe Book is built: architecture, stack, Docker MongoDB, the API contract both backends must follow, auth, backend and frontend structure, uploads, and testing. Collection shapes, indexes, and queries are in `DATABASE_SCHEMA.md`.

The main constraint: **one React frontend and one MongoDB database, served by two interchangeable backends** (Express + Mongoose, FastAPI + Beanie). Both backends expose the same API and store the same documents.

---

## 2. Architecture

```
          ┌────────────────────────────────┐
          │  React frontend (Vite) :5173   │
          └───────────────┬────────────────┘
                          │  JSON over /api/v1, Bearer JWT
          ┌───────────────┴────────────────┐
          ▼                                ▼
 ┌──────────────────────┐        ┌──────────────────────┐
 │ Express 5 + Mongoose │   OR   │ FastAPI + Beanie 2   │
 │ :5000                │        │ :8000                │
 └──────────┬───────────┘        └──────────┬───────────┘
            └──────────────┬────────────────┘
                           ▼
       ┌─────────────────────────────────────┐
       │ MongoDB 7 in Docker · db recipebook │
       └─────────────────────────────────────┘
          Both backends ──► Cloudinary (images)
```

| # | Decision | Why |
|---|---|---|
| D1 | `db/init-db.js` creates collections, validators, indexes, and categories | One place for the schema; the database rejects bad documents from either backend |
| D2 | Mongoose `autoIndex: false`; Beanie declares no indexes | Avoids index conflicts with the init script |
| D3 | Stored field names are camelCase in both stacks | Both backends read each other's documents |
| D4 | Mongoose `versionKey: false` and `_id: false` on embedded sub-schemas | No `__v` and no `_id` on array items, so documents match the FastAPI ones |
| D5 | Ingredients, steps, and images are embedded; reviews and likes are separate collections | Bounded vs unbounded data (see `DATABASE_SCHEMA.md` §3) |
| D6 | `avgRating`, `reviewCount`, `likeCount` stored on the recipe | List pages don't need joins |
| D7 | No transactions, plain (non-replica-set) MongoDB | Multi-step writes are short and low-risk at this scale; keeps Docker setup to one container with no extra config |
| D8 | Express 5 | Errors thrown in async handlers reach the error handler automatically |
| D9 | Beanie 2 (on PyMongo's async API) | Motor is deprecated and Beanie 2 dropped it |

---

## 3. Tech stack

| Layer | Choice |
|---|---|
| Database | MongoDB 7 (`mongo:7` Docker image) |
| DB GUI | MongoDB Compass → `mongodb://localhost:27017` |
| Frontend | React, Vite, React Router, Axios, Tailwind CSS |
| Backend A | Node.js 22, Express 5, Mongoose 8, zod, jsonwebtoken, bcryptjs, multer, cloudinary, cors, dotenv, morgan |
| Backend B | Python 3.12, FastAPI, Uvicorn, Beanie 2, Pydantic 2, pydantic-settings, PyJWT, bcrypt, python-multipart, cloudinary |
| Images | Cloudinary (free tier) |
| API testing | Postman (or FastAPI's `/docs` page) |

Many online tutorials still show Motor and Beanie 1.x; follow the current Beanie docs when they disagree.

---

## 4. Repository layout

```
recipe-book/
├── docs/                PRD.md · TRD.md · DATABASE_SCHEMA.md
├── docker-compose.yml
├── db/init-db.js        collections, validators, indexes, categories
├── frontend/
├── backend-express/
└── backend-fastapi/
```

---

## 5. Docker MongoDB

```bash
docker compose up -d                                              # start MongoDB
docker compose ps                                                 # wait for "healthy"
docker compose exec mongo mongosh recipebook /scripts/init-db.js  # schema, indexes, categories (safe to re-run)

docker compose exec mongo mongosh recipebook                      # open a shell
docker compose down                                               # stop
docker compose down -v                                            # stop and delete all data
```

| Client | Connection string |
|---|---|
| Express / FastAPI (on your machine) | `mongodb://localhost:27017/recipebook` |
| Compass | `mongodb://localhost:27017` |

Data lives in the Docker volume `recipebook-mongo-data`. Port 27017 is bound to localhost only, and there's no database password (local development only).

---

## 6. API contract

Both backends implement exactly this. Keep a Postman collection and run it against port 5000 and port 8000.

### 6.1 Conventions

- Base path `/api/v1`. Express on `:5000`, FastAPI on `:8000`. CORS allows `http://localhost:5173`.
- JSON with camelCase keys. IDs are strings named `id` (never `_id`). Dates are ISO 8601 UTC.
- Auth header `Authorization: Bearer <token>`.
- Lists take `?page=1&limit=12` (limit max 50) and return `{ "items": [], "page": 1, "limit": 12, "total": 40 }`.
- `foodType` query param: `veg` or `nonveg`; leave it out for Both.
- Every error looks like `{ "error": { "code": "VALIDATION_ERROR", "message": "title is required" } }`.

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad body or query (FastAPI's default 422 is changed to 400) |
| 401 | `UNAUTHENTICATED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Not the owner, not an admin, or reviewing your own recipe |
| 404 | `NOT_FOUND` | Unknown or invalid id |
| 409 | `CONFLICT` | Email already registered, or already reviewed |
| 500 | `INTERNAL` | Anything else |

### 6.2 Endpoints (21)

Auth: `—` none · `opt` optional (used for `likedByMe`) · `user` logged in · `owner` the recipe's or review's author · `admin`.

**Auth**

| Method | Path | Auth | Request → Response |
|---|---|---|---|
| POST | `/auth/register` | — | `{ name, email, password }` → 201 `{ user, token }` |
| POST | `/auth/login` | — | `{ email, password }` → 200 `{ user, token }` |
| GET | `/auth/me` | user | → 200 `user` |

`user` = `{ id, name, email, role, createdAt }`.

**Categories**

| Method | Path | Auth | Request → Response |
|---|---|---|---|
| GET | `/categories` | — | `?foodType` → 200 `[ { slug, name, imageUrl, recipeCount } ]`, categories with 0 recipes left out |

**Recipes**

| Method | Path | Auth | Request → Response |
|---|---|---|---|
| GET | `/recipes` | — | `?q&foodType&category&dish&page&limit` → 200 page of cards, newest first |
| GET | `/recipes/trending` | — | `?foodType&days=7&limit=10` → 200 `[ card + weekLikes ]` |
| GET | `/recipes/:id` | opt | → 200 full recipe + `author { id, name }` + `likedByMe` |
| POST | `/recipes` | user | recipe body → 201 full recipe |
| PUT | `/recipes/:id` | owner | full recipe body → 200 full recipe |
| DELETE | `/recipes/:id` | owner or admin | → 204 (also deletes its reviews, likes, and images) |
| POST | `/uploads` | user | multipart field `image` → 201 `{ url, publicId }` |

Card = `{ id, title, dishName, image, foodType, category, avgRating, reviewCount, likeCount, author: { id, name }, createdAt }` where `image` is the first entry of `images`.

**Reviews**

| Method | Path | Auth | Request → Response |
|---|---|---|---|
| GET | `/recipes/:id/reviews` | — | `?page&limit` → 200 page of `{ id, rating, comment, user: { id, name }, createdAt }` |
| POST | `/recipes/:id/reviews` | user | `{ rating, comment? }` → 201 review · 403 own recipe · 409 already reviewed |
| DELETE | `/reviews/:id` | owner or admin | → 204 |

**Likes and "my" lists**

| Method | Path | Auth | Request → Response |
|---|---|---|---|
| POST | `/recipes/:id/like` | user | → 200 `{ liked: true, likeCount }` (liking twice changes nothing) |
| DELETE | `/recipes/:id/like` | user | → 200 `{ liked: false, likeCount }` |
| GET | `/me/likes` | user | `?foodType&page&limit` → 200 page of cards, newest like first |
| GET | `/me/recipes` | user | `?page&limit` → 200 page of cards |

**Admin**

| Method | Path | Auth | Request → Response |
|---|---|---|---|
| GET | `/admin/recipes` | admin | `?q&page&limit` → 200 page of cards (+ `author.email`) |
| GET | `/admin/users` | admin | `?page&limit` → 200 page of `user + recipeCount` |
| GET | `/admin/users/:id/recipes` | admin | `?page&limit` → 200 page of cards |

Admins delete recipes and reviews through the normal `DELETE` routes (allowed by the "owner or admin" check).

**Route order:** register `/recipes/trending` before `/recipes/:id` in both frameworks, or "trending" gets treated as an id.

---

## 7. Auth

| Item | Spec |
|---|---|
| Passwords | bcrypt, cost 12 |
| Token | JWT HS256, payload `{ sub: userId, role }`, expires in 7 days. Same `JWT_SECRET` in both backends, so one token works on either |
| Frontend storage | `localStorage`: `rb_token`, and `rb_guest=true` for guests |
| Each request | Verify the token, load the user by `sub` (404 user → 401), use the role from the database |
| Ownership | Compare `recipe.author` / `review.user` with the current user's id; admins pass every ownership check |
| First admin | `createAdmin` script; `/auth/register` always makes `role: user` |

---

## 8. Backends

### 8.1 Layers (both)

routes → (controllers, Express only) → services → models. Database queries live only in services, so the FastAPI port is a line-by-line translation.

### 8.2 Express

```
backend-express/
├── src/
│   ├── config/        env.js · db.js · cloudinary.js
│   ├── models/        User · Category · Recipe · Review · Like   (versionKey:false, autoIndex:false)
│   ├── validators/    zod schemas
│   ├── middleware/    auth.js (requireAuth, optionalAuth, requireAdmin) · validate.js
│   │                  upload.js (multer, memory, 5 MB) · errorHandler.js
│   ├── services/      recipe · review · like · category · admin · upload
│   ├── controllers/
│   ├── routes/        index.js (/api/v1) · auth · categories · recipes · reviews · likes · me · uploads · admin
│   ├── app.js
│   └── server.js
├── scripts/           createAdmin.js · seed.js
└── package.json       scripts: dev (nodemon), start, create-admin, seed
```

- Add a `toJSON` transform to every model: `_id` → `id`, remove `passwordHash`.
- `errorHandler` maps zod errors → 400, duplicate key (11000) → 409, invalid ObjectId (`CastError`) → 404, everything else → 500.

### 8.3 FastAPI

```
backend-fastapi/
├── app/
│   ├── core/          config.py · db.py (AsyncMongoClient + init_beanie) · security.py · errors.py
│   ├── models/        user · category · recipe · review · like   (Beanie Documents)
│   ├── schemas/       request/response models (CamelModel base, Page[T])
│   ├── deps.py        get_current_user · get_optional_user · require_admin
│   ├── services/      recipe · review · like · category · admin · upload
│   ├── routers/       auth · categories · recipes · reviews · likes · me · uploads · admin
│   └── main.py
├── scripts/           create_admin.py · seed.py
└── requirements.txt
```

- **camelCase in the database:** give every model `model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)`. On day one, save a recipe through FastAPI and check in Compass that the field is `prepTimeMin`, not `prep_time_min`.
- **Never return a Document directly.** Use response schemas so `passwordHash` never leaks and `_id` becomes `id`.
- **References** are `PydanticObjectId` fields (not Beanie `Link`), so queries match the Express ones.
- **Timestamps:** set `createdAt` / `updatedAt` yourself (Beanie has no automatic timestamps).
- Add an exception handler that turns `RequestValidationError` into the 400 error shape.

### 8.4 Express ↔ FastAPI

| Concern | Express | FastAPI |
|---|---|---|
| Router | `express.Router()` | `APIRouter(prefix=...)` |
| Validation | zod | Pydantic models |
| Current user | `req.user` (middleware) | `Depends(get_current_user)` |
| Errors | error-handler middleware | `@app.exception_handler` |
| Uploads | multer | `UploadFile = File(...)` |
| Dev server | `nodemon src/server.js` | `uvicorn app.main:app --reload --port 8000` |
| API docs | — | free at `/docs` |

### 8.5 Business rules

| Rule | How |
|---|---|
| Like counts exactly | Insert into `likes`; if it succeeds, `$inc: { likeCount: 1 }`; a duplicate-key error means already liked → no change. Unlike: `deleteOne`, then `$inc: -1` only if something was deleted |
| Rating stays correct | After inserting or deleting a review, run a small aggregation over that recipe's reviews and `$set` `avgRating` (1 decimal) and `reviewCount` |
| `likedByMe` | On the recipe page only: `likes.findOne({ user, recipe })` |
| Delete cascade | Delete the recipe's reviews, then its likes, then the recipe, then its Cloudinary images |
| Category check | On create/update, the `category` slug must exist in `categories`, else 400 |
| Dish filter | `dish` query param matches `dishName` case-insensitively (store `dishName` trimmed with single spaces) |
| Search | `q` uses the text index on `title` + `dishName` |

---

## 9. Validation

| Field | Rule |
|---|---|
| `name` | 2–60 chars |
| `email` | valid email, stored lowercase, unique |
| `password` | 8–72 chars |
| `title` | 3–120 chars |
| `description` | up to 500 chars, optional |
| `dishName` | 2–80 chars |
| `foodType` | `veg` or `nonveg` |
| `category` | existing category slug |
| `difficulty` | `easy`, `medium`, `hard` |
| `servings` | whole number 1–50 |
| `prepTimeMin`, `cookTimeMin` | whole number 0–1440 |
| `images` | 1–3 of `{ url, publicId }` |
| `ingredients` | 1–40 items: `name` (required, ≤ 60), `quantity` (number ≥ 0, optional), `unit` (≤ 20, optional), `note` (≤ 60, optional) |
| `instructions` | 1–8 sections: `section` (≤ 40, optional), `steps` 1–30 items: `text` (3–600, required), `durationMin` (0–1440, optional), `tip` (≤ 200, optional) |
| review `rating` | whole number 1–5 |
| review `comment` | up to 1000 chars, optional |

The server sets `author`, `avgRating`, `reviewCount`, `likeCount`, and timestamps, and ignores them if the client sends them. Validating every input with zod / Pydantic also blocks NoSQL injection (e.g. `{"email": {"$gt": ""}}` fails because `email` must be a string).

---

## 10. Image uploads

1. The form uploads each picked file to `POST /uploads`.
2. The backend checks size (≤ 5 MB) and type (JPEG/PNG/WebP), streams it to Cloudinary folder `recipebook/`, and returns `{ url, publicId }`.
3. The form puts those objects in `images` when saving the recipe.
4. Deleting a recipe deletes its images from Cloudinary using `publicId`.

---

## 11. Frontend

```
frontend/src/
├── api/          client.js (axios: baseURL from VITE_API_URL, adds token) · auth · recipes · reviews · likes · admin
├── context/      AuthContext (user, token, isGuest) · FoodTypeContext (veg | nonveg | both, in localStorage)
├── components/   Navbar · FoodTypeToggle · RecipeCard · VegMark · LikeButton · CategoryTile
│                 ImageGallery · IngredientList · InstructionSections · ReviewList · ReviewForm
│                 Pagination · ConfirmDialog · ProtectedRoute · AdminRoute
├── pages/        Landing · Login · Register · Home · Category · RecipeDetail · RecipeForm
│                 MyRecipes · WantToTry · Admin
├── App.jsx
└── main.jsx
```

- **Switching backends:** `.env.express` and `.env.fastapi` each set `VITE_API_URL`; run `npm run dev:express` or `npm run dev:fastapi` (`vite --mode express|fastapi`).
- **Entry:** `/` redirects to `/home` if there's a token or the guest flag; `/home` redirects to `/` if there's neither.
- **Toggle:** every list request adds `foodType` from `FoodTypeContext` (nothing for Both), and pages refetch when it changes.
- **Like button:** updates the heart and count immediately, then calls the API, and reverts if the call fails.
- **Recipe form:** add/remove ingredient rows, sections, and steps; upload images before saving.

---

## 12. Environment variables

| Variable | Example | Used by |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/recipebook` | both backends |
| `JWT_SECRET` | 32+ random characters, same in both | both backends |
| `CORS_ORIGIN` | `http://localhost:5173` | both backends |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from the Cloudinary console | both backends |
| `PORT` | `5000` | Express |
| `VITE_API_URL` | `http://localhost:5000/api/v1` or `:8000` | frontend |

Commit a `.env.example` with these names and no values; never commit `.env`.

---

## 13. Testing

- **During development:** FastAPI's `/docs` page and a Postman collection with every endpoint.
- **Parity check:** run the same Postman collection against `:5000` and `:8000`; status codes and response shapes must match.
- **Index check:** `explain("executionStats")` in mongosh on the category list, trending, and search queries should show `IXSCAN`.
- **Manual demo run:** the PRD §3 flows, once per backend.

---

## 14. Suggested build order

1. `docker compose up -d`, run `init-db.js`, and check that an invalid insert is rejected in mongosh.
2. Express: config, models, auth, `createAdmin`.
3. Express: uploads, recipe CRUD, categories, list filters, trending.
4. Frontend: Landing, auth, guest mode, toggle, Home, Category, RecipeDetail, RecipeForm, MyRecipes.
5. Likes, Want to try, reviews (API then UI).
6. Admin (API then page).
7. Seed script and Postman collection.
8. FastAPI port in the same order; check camelCase storage in Compass at step 2 and run the Postman collection after each step.
9. Polish: loading and empty states, README, screenshots.
