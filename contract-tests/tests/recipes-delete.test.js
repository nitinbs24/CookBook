import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { testDb } from '../src/db.js';
import { createRecipe, registerAdmin, registerUser } from '../src/fixtures.js';

describe('DELETE /recipes/:id', () => {
  let owner;
  let recipe;
  let otherRecipe;
  beforeEach(async () => {
    owner = await registerUser();
    recipe = await createRecipe(owner.token);
    otherRecipe = await createRecipe(owner.token, { title: 'Untouched Recipe' });
    const fan = await registerUser();
    await api('POST', `/recipes/${recipe.id}/like`, { token: fan.token });
    await api('POST', `/recipes/${otherRecipe.id}/like`, { token: fan.token });
    await api('POST', `/recipes/${recipe.id}/reviews`, { token: fan.token, body: { rating: 4 } });
    await api('POST', `/recipes/${otherRecipe.id}/reviews`, { token: fan.token, body: { rating: 5 } });
  });

  it('lets the owner delete it: 204, and its reviews and likes go too, nobody else’s', async () => {
    const res = await api('DELETE', `/recipes/${recipe.id}`, { token: owner.token });
    const db = await testDb();
    const id = new ObjectId(recipe.id);
    const otherId = new ObjectId(otherRecipe.id);

    expect(res.status).toBe(204);
    expect((await api('GET', `/recipes/${recipe.id}`)).status).toBe(404);
    expect(await db.collection('reviews').countDocuments({ recipe: id })).toBe(0);
    expect(await db.collection('likes').countDocuments({ recipe: id })).toBe(0);
    expect(await db.collection('reviews').countDocuments({ recipe: otherId })).toBe(1);
    expect(await db.collection('likes').countDocuments({ recipe: otherId })).toBe(1);
  });

  it('lets an admin delete any recipe', async () => {
    const admin = await registerAdmin();

    const res = await api('DELETE', `/recipes/${recipe.id}`, { token: admin.token });

    expect(res.status).toBe(204);
  });

  it('returns 403 FORBIDDEN for a user who is not the author', async () => {
    const other = await registerUser();

    const res = await api('DELETE', `/recipes/${recipe.id}`, { token: other.token });

    expect(res.status).toBe(403);
    expect((await api('GET', `/recipes/${recipe.id}`)).status).toBe(200);
  });

  it('returns 404 for an unknown recipe and 401 without a token', async () => {
    expect((await api('DELETE', `/recipes/${new ObjectId()}`, { token: owner.token })).status).toBe(404);
    expect((await api('DELETE', `/recipes/${recipe.id}`)).status).toBe(401);
  });
});
