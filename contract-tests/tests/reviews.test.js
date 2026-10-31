import { ObjectId } from 'mongodb';
import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { createRecipe, registerAdmin, registerUser } from '../src/fixtures.js';

const REVIEW_KEYS = ['comment', 'createdAt', 'id', 'rating', 'user'];
const ratingOf = async (id) => {
  const { body } = await api('GET', `/recipes/${id}`);
  return { avgRating: body.avgRating, reviewCount: body.reviewCount };
};

describe('POST /recipes/:id/reviews', () => {
  let owner;
  let recipe;
  beforeAll(async () => {
    owner = await registerUser();
    recipe = await createRecipe(owner.token);
  });

  it('returns 201 with { id, rating, comment, user, createdAt } and updates the recipe rating', async () => {
    const reviewer = await registerUser({ name: 'Ravi' });

    const res = await api('POST', `/recipes/${recipe.id}/reviews`, {
      token: reviewer.token,
      body: { rating: 5, comment: '  Loved it  ' },
    });

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(REVIEW_KEYS);
    expect(res.body).toMatchObject({ rating: 5, comment: 'Loved it', user: { id: reviewer.user.id, name: 'Ravi' } });
    expect(await ratingOf(recipe.id)).toEqual({ avgRating: 5, reviewCount: 1 });
  });

  it('averages to 1 decimal place (5, 4, 4 → 4.3) and stores a missing comment as null', async () => {
    for (const rating of [4, 4]) {
      const reviewer = await registerUser();
      const res = await api('POST', `/recipes/${recipe.id}/reviews`, { token: reviewer.token, body: { rating } });
      expect(res.body.comment).toBeNull();
    }

    expect(await ratingOf(recipe.id)).toEqual({ avgRating: 4.3, reviewCount: 3 });
  });

  it('returns 403 FORBIDDEN when reviewing your own recipe', async () => {
    const res = await api('POST', `/recipes/${recipe.id}/reviews`, { token: owner.token, body: { rating: 5 } });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 409 CONFLICT for a second review by the same user', async () => {
    const reviewer = await registerUser();
    await api('POST', `/recipes/${recipe.id}/reviews`, { token: reviewer.token, body: { rating: 3 } });

    const res = await api('POST', `/recipes/${recipe.id}/reviews`, { token: reviewer.token, body: { rating: 1 } });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it.each([
    ['rating 0', { rating: 0 }],
    ['rating 6', { rating: 6 }],
    ['rating 2.5', { rating: 2.5 }],
    ['a missing rating', { comment: 'nice' }],
    ['a comment over 1000 chars', { rating: 4, comment: 'x'.repeat(1001) }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, body) => {
    const reviewer = await registerUser();

    const res = await api('POST', `/recipes/${recipe.id}/reviews`, { token: reviewer.token, body });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 401 without a token and 404 for an unknown recipe', async () => {
    const reviewer = await registerUser();

    expect((await api('POST', `/recipes/${recipe.id}/reviews`, { body: { rating: 4 } })).status).toBe(401);
    expect((await api('POST', `/recipes/${new ObjectId()}/reviews`, { token: reviewer.token, body: { rating: 4 } })).status).toBe(404);
  });
});

describe('GET /recipes/:id/reviews', () => {
  let recipe;
  beforeAll(async () => {
    const owner = await registerUser();
    recipe = await createRecipe(owner.token);
    for (const [name, rating] of [['First', 3], ['Second', 4], ['Third', 5]]) {
      const reviewer = await registerUser({ name });
      await api('POST', `/recipes/${recipe.id}/reviews`, { token: reviewer.token, body: { rating } });
    }
  });

  it('returns a page of reviews, newest first, with the reviewer name', async () => {
    const res = await api('GET', `/recipes/${recipe.id}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 12, total: 3 });
    expect(res.body.items.map((r) => r.user.name)).toEqual(['Third', 'Second', 'First']);
    expect(Object.keys(res.body.items[0]).sort()).toEqual(REVIEW_KEYS);
  });

  it('paginates', async () => {
    const res = await api('GET', `/recipes/${recipe.id}/reviews?page=2&limit=2`);

    expect(res.body.items.map((r) => r.user.name)).toEqual(['First']);
  });

  it('returns 404 for an unknown recipe', async () => {
    expect((await api('GET', `/recipes/${new ObjectId()}/reviews`)).status).toBe(404);
  });
});

describe('DELETE /reviews/:id', () => {
  let recipe;
  let reviewer;
  let review;
  beforeAll(async () => {
    const owner = await registerUser();
    recipe = await createRecipe(owner.token);
    reviewer = await registerUser();
    review = (await api('POST', `/recipes/${recipe.id}/reviews`, { token: reviewer.token, body: { rating: 2 } })).body;
  });

  it('returns 403 FORBIDDEN for someone who is not the reviewer or an admin', async () => {
    const other = await registerUser();

    const res = await api('DELETE', `/reviews/${review.id}`, { token: other.token });

    expect(res.status).toBe(403);
  });

  it('lets the reviewer delete it: 204, and the rating resets to 0', async () => {
    const res = await api('DELETE', `/reviews/${review.id}`, { token: reviewer.token });

    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
    expect(await ratingOf(recipe.id)).toEqual({ avgRating: 0, reviewCount: 0 });
  });

  it('lets an admin delete any review and recomputes the rating', async () => {
    const [a, b] = [await registerUser(), await registerUser()];
    const keep = await api('POST', `/recipes/${recipe.id}/reviews`, { token: a.token, body: { rating: 4 } });
    const remove = await api('POST', `/recipes/${recipe.id}/reviews`, { token: b.token, body: { rating: 1 } });
    const admin = await registerAdmin();

    const res = await api('DELETE', `/reviews/${remove.body.id}`, { token: admin.token });

    expect(res.status).toBe(204);
    expect(keep.status).toBe(201);
    expect(await ratingOf(recipe.id)).toEqual({ avgRating: 4, reviewCount: 1 });
  });

  it('returns 404 for an unknown review and 401 without a token', async () => {
    expect((await api('DELETE', `/reviews/${new ObjectId()}`, { token: reviewer.token })).status).toBe(404);
    expect((await api('DELETE', `/reviews/${new ObjectId()}`)).status).toBe(401);
  });
});
