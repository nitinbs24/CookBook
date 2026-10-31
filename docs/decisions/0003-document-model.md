# ADR-0003: Embed bounded recipe data, separate unbounded data, store counters, no transactions

## Status
Accepted

## Date
2026-10-31

## Context
A recipe page shows the photos, ingredients, sectioned steps, rating, like count, and reviews. List pages show cards with the rating and like count. Reviews and likes can grow without limit; ingredients and steps cannot (at most 40 ingredients, 8 sections × 30 steps, 3 images). The full reasoning is in `DATABASE_SCHEMA.md` §3.

## Decision
- **Embed** `images`, `ingredients`, and `instructions[].steps` in the recipe document.
- **Separate collections** for `reviews` and `likes`, each referencing the recipe and user by ObjectId, with unique `{recipe, user}` / `{user, recipe}` indexes enforcing one per user.
- `recipes.author` references `users`; `recipes.category` stores the category **slug**, so lists filter without a lookup.
- **Stored counters** on the recipe: `likeCount` changes with `$inc` only after a like insert succeeds or a delete removes something. `avgRating` and `reviewCount` are recomputed by a small aggregation after each review insert or delete.
- **No transactions.** MongoDB runs as a single node (not a replica set), and multi-step writes (like + `$inc`, delete cascade) are short.

## Alternatives Considered

### Embed reviews in the recipe
- Pros: one read for the recipe page.
- Cons: unbounded growth toward the 16 MB document limit, and every recipe read pays for all its reviews.
- Rejected.

### Count likes and reviews on every list query
- Pros: counts can never drift.
- Cons: a `$lookup` or count per card on every list page.
- Rejected: stored counters keep list queries index-only.

### Replica set with transactions
- Pros: atomic like + counter and cascade.
- Cons: a more complex Docker setup (replica-set init, keyfile) for little benefit at this scale.
- Rejected (TRD D7).

## Consequences
- A crash between the like insert and the `$inc` can leave `likeCount` off by one. This is accepted at this scale. A count can be repaired by hand by recounting the `likes` collection for that recipe; there is no automatic repair.
- The delete cascade (reviews, then likes, then the recipe, then the images) is not atomic. The recipe is deleted last on purpose: a failure part-way leaves the recipe visible with stale counters, and deleting it again finishes the job. (Deleting the recipe first would leave orphaned reviews or likes that nothing could clean up.) A failed Cloudinary delete only orphans the image (ADR-0005).
- `dishName` is stored trimmed with single spaces, so the case-insensitive dish filter matches exactly.
