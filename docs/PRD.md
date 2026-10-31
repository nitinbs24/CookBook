# Recipe Book — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Recipe Book — a multi-user recipe sharing app |
| **Owner** | Nitin |
| **Context** | College NoSQL assignment: demonstrate CRUD and MongoDB features |
| **Build plan** | One React frontend, two interchangeable backends (Express + Mongoose, FastAPI + Beanie), one MongoDB in Docker |
| **Status** | v2 (slimmed) — 31 Oct 2026 |
| **Related docs** | `TRD.md` (how it's built), `DATABASE_SCHEMA.md` (collections, indexes, queries) |

---

## 1. Overview

Recipe Book lets users share recipes with step-by-step cooking instructions, browse other users' recipes by main ingredient (Paneer, Chicken, Egg, Potato…), save the ones they want to try, and review them. A **Veg / Non-veg / Both** toggle filters the whole app. An **admin** can see every user's recipes and delete any of them.

### 1.1 Goals

| # | Goal | Shown by |
|---|---|---|
| G1 | Full CRUD on a document database | Recipes, reviews, and likes are created, read, updated, and deleted through the UI |
| G2 | MongoDB features | Embedded arrays (ingredients, steps, images), references + `$lookup`, an aggregation pipeline (trending), text and compound indexes, schema validation |
| G3 | Same app on two backend stacks | The React app works unchanged against Express and FastAPI by switching one env value |

### 1.2 Non-goals

Payments, real-time features, email verification or password reset, drafts, moderation workflows (remove/restore, audit logs), user suspension, deployment, mobile apps.

---

## 2. Users

| Persona | Account | Can do |
|---|---|---|
| **Guest** | None ("Continue as guest") | Browse everything, read recipes and reviews |
| **User** | `role: user` | Everything a guest can, plus post/edit/delete own recipes, like recipes, write reviews |
| **Admin** | `role: admin`, created by a script | Everything a user can, plus see all users and all recipes, delete any recipe or review |

---

## 3. User flows

1. **Entry:** visitor opens `/` (landing page) → Sign up, Log in, or Continue as guest → lands on `/home`. Returning users and guests skip the landing page.
2. **Browse:** on `/home`, set the Veg / Non-veg / Both toggle → see Trending this week and category tiles → tap a tile (e.g. Paneer) → see every user's paneer recipes → open one.
3. **Recipe (dish) page:** photos, ingredients, step-by-step instructions, reviews. Like it to save it to **Want to try**.
4. **Contribute:** logged-in user adds a recipe with photos, category, dish name, veg/non-veg, ingredients, and instruction sections. Can edit or delete it later.
5. **Review:** logged-in user (not the author) rates 1–5 with an optional comment.
6. **Admin:** opens `/admin` → sees all recipes from all users and all users → deletes any recipe.

---

## 4. Features

Priority: **P0** = must have for the demo, **P1** = add if time allows.

### 4.1 Landing and auth

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-1 | Landing page `/` | P0 | Short intro to the app, a few feature highlights, and Sign up / Log in / Continue as guest buttons |
| F-2 | Register | P0 | Name, email, password (≥ 8 chars); duplicate email shows an error; success logs the user in |
| F-3 | Log in / log out | P0 | Wrong credentials show a generic error; logout clears the session and guest mode |
| F-4 | Continue as guest | P0 | No account created; guest can browse all public pages; survives a page refresh |
| F-5 | Guest prompts | P0 | Like and review buttons are visible to guests but open a "Sign up to do this" message |

### 4.2 Veg / Non-veg / Both toggle

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-10 | Toggle in the navbar | P0 | Three options, default Both, remembered in the browser |
| F-11 | Filters every list | P0 | Trending, category pages, search results, Want to try, My recipes all respect it |
| F-12 | Category tiles follow it | P0 | Categories with no matching recipes are hidden (Chicken disappears under Veg) |
| F-13 | Veg / non-veg mark | P0 | Green dot (veg) or brown dot (non-veg) with a text label on every card and recipe page. Egg counts as non-veg |

### 4.3 Home `/home`

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-20 | Trending this week | P0 | Up to 10 recipes with the most likes in the last 7 days |
| F-21 | Category tiles | P0 | Image, name, and recipe count for each category, in a fixed order |
| F-22 | Latest recipes + search | P1 | Newest recipes, 12 per page, with a search box that matches title and dish name |

### 4.4 Category page `/category/:slug`

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-30 | All users' recipes in the category | P0 | Cards (photo, title, dish name, author, veg mark, rating, likes), newest first, paginated |
| F-31 | Filter by dish | P1 | Clicking a dish name on a card shows only recipes for that dish (e.g. all Paneer Butter Masala versions) |

### 4.5 Recipe (dish) page `/recipes/:id`

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-40 | Photos | P0 | 1–3 images, first is the cover |
| F-41 | Details | P0 | Title, dish name, author, veg mark, category, prep and cook time, servings, difficulty, rating, like count |
| F-42 | Ingredients | P0 | Name, quantity, unit, and an optional note ("finely chopped") |
| F-43 | Detailed instructions | P0 | Grouped into sections (e.g. "Marinade", "Gravy"); each step has text, optional duration, optional tip |
| F-44 | Like button | P0 | Shows whether you liked it; toggles instantly; count updates |
| F-45 | Reviews | P0 | Average rating, list of reviews (name, stars, comment, date), review form |
| F-46 | Owner controls | P0 | Author sees Edit and Delete buttons |

### 4.6 Recipe management

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-50 | Add recipe | P0 | Form: photos (1–3), title, description, category, dish name, veg/non-veg, difficulty, servings, prep and cook time, ingredient rows, instruction sections with steps |
| F-51 | Edit own recipe | P0 | Same form, prefilled; others' recipes can't be edited |
| F-52 | Delete own recipe | P0 | Confirmation; deletes the recipe, its reviews, and its likes |
| F-53 | My recipes `/me/recipes` | P0 | All your recipes |

### 4.7 Likes and reviews

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-60 | Like / unlike | P0 | One like per user per recipe; count is always correct |
| F-61 | Want to try `/me/likes` | P0 | Your liked recipes, most recently liked first |
| F-62 | Write a review | P0 | Rating 1–5 required, comment optional; one review per user per recipe; not on your own recipe |
| F-63 | Delete own review | P1 | Average rating updates |

### 4.8 Admin `/admin`

| ID | Feature | Priority | Acceptance criteria |
|---|---|---|---|
| F-70 | Admin-only access | P0 | Non-admins get 403 from the API and never see the admin link |
| F-71 | All recipes | P0 | Table of every recipe from every user: photo, title, author, category, veg mark, rating, likes, date; search by title; paginated |
| F-72 | Delete any recipe | P0 | Confirmation; same cascade as F-52 |
| F-73 | All users | P1 | Table: name, email, role, number of recipes, joined date; click to see their recipes |
| F-74 | Delete any review | P1 | Admins see a delete button on every review |

---

## 5. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Both backends return identical responses (same fields, status codes) for every endpoint |
| NFR-2 | Every list query uses an index (shown with `explain()` in the viva) |
| NFR-3 | Passwords hashed with bcrypt; JWT auth; ownership and admin checks happen on the server |
| NFR-4 | Usable on a phone-width screen (360 px) |
| NFR-5 | A fresh clone runs with `docker compose up -d`, one DB init command, and one command per app |
| NFR-6 | Images ≤ 5 MB, JPEG/PNG/WebP |

---

## 6. Screens

| Route | Screen | Access |
|---|---|---|
| `/` | Landing | Public |
| `/login`, `/register` | Auth | Public |
| `/home` | Trending, category tiles, latest + search | User, guest |
| `/category/:slug` | Category page | User, guest |
| `/recipes/:id` | Recipe (dish) page | User, guest |
| `/recipes/new`, `/recipes/:id/edit` | Recipe form | User |
| `/me/recipes` | My recipes | User |
| `/me/likes` | Want to try | User |
| `/admin` | All recipes / All users (two tabs) | Admin |

---

## 7. Assumptions

- Egg counts as non-veg, matching the green/brown dots on Indian food labels.
- Categories are a fixed list of 10 created by the database init script.
- Guests are anonymous; nothing about them is stored on the server.
- Every saved recipe is public immediately (no drafts).

## 8. Glossary

| Term | Meaning |
|---|---|
| **Category** | Main-ingredient tile: Paneer, Chicken, Egg, Potato… |
| **Dish name** | What the recipe makes, e.g. "Paneer Butter Masala". Several users can post their own version |
| **Food type** | `veg` or `nonveg` on each recipe; drives the toggle |
| **Like** | Saves a recipe to Want to try |
