import { beforeAll, describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { api } from '../src/http.js';
import { testDb } from '../src/db.js';
import { insertLikes, recipeBody, registerUser } from '../src/fixtures.js';

const FULL_KEYS = [
  'author', 'avgRating', 'category', 'cookTimeMin', 'createdAt', 'description', 'difficulty', 'dishName',
  'foodType', 'id', 'images', 'ingredients', 'instructions', 'likeCount', 'prepTimeMin', 'reviewCount',
  'servings', 'title', 'updatedAt',
];

describe('POST /recipes', () => {
  let owner;
  beforeAll(async () => {
    owner = await registerUser({ name: 'Owner Cook' });
  });

  it('returns 201 with the full recipe, author { id, name }, and zeroed counters', async () => {
    const res = await api('POST', '/recipes', { token: owner.token, body: recipeBody() });

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(FULL_KEYS);
    expect(res.body.id).toMatch(/^[0-9a-f]{24}$/);
    expect(res.body.author).toEqual({ id: owner.user.id, name: 'Owner Cook' });
    expect(res.body).toMatchObject({ avgRating: 0, reviewCount: 0, likeCount: 0, title: 'Dhaba-style Paneer Butter Masala' });
    expect(res.body.createdAt).toBe(res.body.updatedAt);
  });

  it('fills missing optional fields with null', async () => {
    const res = await api('POST', '/recipes', {
      token: owner.token,
      body: recipeBody({ description: undefined }),
    });

    expect(res.body.description).toBeNull();
    expect(res.body.ingredients[1]).toEqual({ name: 'Butter', quantity: 2, unit: 'tbsp', note: null });
    expect(res.body.instructions[1]).toEqual({ section: null, steps: [{ text: 'Add paneer and simmer.', durationMin: null, tip: null }] });
  });

  it('ignores server-set fields sent by the client', async () => {
    const res = await api('POST', '/recipes', {
      token: owner.token,
      body: recipeBody({ author: new ObjectId().toString(), likeCount: 99, avgRating: 5, reviewCount: 7 }),
    });

    expect(res.body.author.id).toBe(owner.user.id);
    expect(res.body).toMatchObject({ likeCount: 0, avgRating: 0, reviewCount: 0 });
  });

  it('stores dishName trimmed with single spaces', async () => {
    const res = await api('POST', '/recipes', {
      token: owner.token,
      body: recipeBody({ dishName: '  Paneer   Butter  Masala ' }),
    });

    expect(res.body.dishName).toBe('Paneer Butter Masala');
  });

  it('stores camelCase fields with no _id on embedded items', async () => {
    const res = await api('POST', '/recipes', { token: owner.token, body: recipeBody() });
    const db = await testDb();

    const stored = await db.collection('recipes').findOne({ _id: new ObjectId(res.body.id) });

    expect(stored).toHaveProperty('prepTimeMin', 20);
    expect(stored).not.toHaveProperty('__v');
    expect(stored.ingredients[0]).not.toHaveProperty('_id');
    expect(stored.instructions[0].steps[0]).not.toHaveProperty('_id');
    expect(stored.author).toBeInstanceOf(ObjectId);
  });

  it('returns 401 without a token', async () => {
    const res = await api('POST', '/recipes', { body: recipeBody() });

    expect(res.status).toBe(401);
  });

  it('returns 400 VALIDATION_ERROR for a category slug that does not exist', async () => {
    const res = await api('POST', '/recipes', { token: owner.token, body: recipeBody({ category: 'tofu' }) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it.each([
    ['no images', { images: [] }],
    ['four images', { images: Array(4).fill({ url: 'https://x.test/a.jpg', publicId: 'recipebook/a' }) }],
    ['a bad foodType', { foodType: 'vegan' }],
    ['no ingredients', { ingredients: [] }],
    ['a 2-char step', { instructions: [{ steps: [{ text: 'ab' }] }] }],
    ['servings 0', { servings: 0 }],
    ['fractional servings', { servings: 2.5 }],
    ['a short title', { title: 'ab' }],
    ['a missing dishName', { dishName: undefined }],
    ['an image outside the recipebook/ folder', { images: [{ url: 'https://x.test/a.jpg', publicId: 'other-folder/a' }] }],
    ['a non-https image url', { images: [{ url: 'http://x.test/a.jpg', publicId: 'recipebook/a' }] }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, overrides) => {
    const res = await api('POST', '/recipes', { token: owner.token, body: recipeBody(overrides) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /recipes/:id', () => {
  let owner;
  let recipe;
  beforeAll(async () => {
    owner = await registerUser({ name: 'Owner Cook' });
    recipe = (await api('POST', '/recipes', { token: owner.token, body: recipeBody() })).body;
  });

  it('returns 200 with the full recipe and likedByMe false for a guest', async () => {
    const res = await api('GET', `/recipes/${recipe.id}`);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([...FULL_KEYS, 'likedByMe'].sort());
    expect(res.body).toEqual({ ...recipe, likedByMe: false });
  });

  it('returns likedByMe true when the logged-in user liked it', async () => {
    const fan = await registerUser();
    await insertLikes([{ recipe: new ObjectId(recipe.id), user: new ObjectId(fan.user.id) }]);

    const res = await api('GET', `/recipes/${recipe.id}`, { token: fan.token });

    expect(res.body.likedByMe).toBe(true);
  });

  it('treats an invalid token as a guest', async () => {
    const res = await api('GET', `/recipes/${recipe.id}`, { token: 'not.a.jwt' });

    expect(res.status).toBe(200);
    expect(res.body.likedByMe).toBe(false);
  });

  it.each([
    ['an unknown id', new ObjectId().toString()],
    ['a malformed id', 'abc'],
  ])('returns 404 NOT_FOUND for %s', async (_label, id) => {
    const res = await api('GET', `/recipes/${id}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('PUT /recipes/:id', () => {
  let owner;
  let recipe;
  beforeAll(async () => {
    owner = await registerUser({ name: 'Owner Cook' });
    recipe = (await api('POST', '/recipes', { token: owner.token, body: recipeBody() })).body;
  });

  it('lets the owner replace the recipe and keeps author, counters, and createdAt', async () => {
    const res = await api('PUT', `/recipes/${recipe.id}`, {
      token: owner.token,
      body: recipeBody({ title: 'Updated Paneer Masala', servings: 2, description: undefined, likeCount: 50 }),
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: recipe.id, title: 'Updated Paneer Masala', servings: 2, description: null,
      author: recipe.author, likeCount: 0, createdAt: recipe.createdAt,
    });
    expect(new Date(res.body.updatedAt) > new Date(recipe.updatedAt)).toBe(true);
  });

  it('returns 403 FORBIDDEN for a user who is not the author', async () => {
    const other = await registerUser();

    const res = await api('PUT', `/recipes/${recipe.id}`, { token: other.token, body: recipeBody() });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 without a token', async () => {
    const res = await api('PUT', `/recipes/${recipe.id}`, { body: recipeBody() });

    expect(res.status).toBe(401);
  });

  it('returns 404 NOT_FOUND for an unknown id', async () => {
    const res = await api('PUT', `/recipes/${new ObjectId()}`, { token: owner.token, body: recipeBody() });

    expect(res.status).toBe(404);
  });

  it('returns 400 VALIDATION_ERROR for an invalid body', async () => {
    const res = await api('PUT', `/recipes/${recipe.id}`, { token: owner.token, body: recipeBody({ images: [] }) });

    expect(res.status).toBe(400);
  });
});
