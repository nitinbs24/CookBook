import { ObjectId } from 'mongodb';
import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { createRecipe, registerUser } from '../src/fixtures.js';

describe('POST and DELETE /recipes/:id/like', () => {
  let recipe;
  let fan;
  beforeAll(async () => {
    const owner = await registerUser();
    recipe = await createRecipe(owner.token);
    fan = await registerUser();
  });

  it('likes a recipe: 200 { liked: true, likeCount: 1 } and likedByMe becomes true', async () => {
    const res = await api('POST', `/recipes/${recipe.id}/like`, { token: fan.token });
    const detail = await api('GET', `/recipes/${recipe.id}`, { token: fan.token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ liked: true, likeCount: 1 });
    expect(detail.body).toMatchObject({ likedByMe: true, likeCount: 1 });
  });

  it('liking twice changes nothing', async () => {
    const res = await api('POST', `/recipes/${recipe.id}/like`, { token: fan.token });

    expect(res.body).toEqual({ liked: true, likeCount: 1 });
  });

  it('unlikes: 200 { liked: false, likeCount: 0 }, and unliking again never goes below 0', async () => {
    const first = await api('DELETE', `/recipes/${recipe.id}/like`, { token: fan.token });
    const again = await api('DELETE', `/recipes/${recipe.id}/like`, { token: fan.token });

    expect(first.status).toBe(200);
    expect(first.body).toEqual({ liked: false, likeCount: 0 });
    expect(again.body).toEqual({ liked: false, likeCount: 0 });
  });

  it('keeps the count exact when the same user likes 5 times at once', async () => {
    const racer = await registerUser();

    await Promise.all(Array.from({ length: 5 }, () => api('POST', `/recipes/${recipe.id}/like`, { token: racer.token })));
    const detail = await api('GET', `/recipes/${recipe.id}`);

    expect(detail.body.likeCount).toBe(1);
  });

  it('returns 401 without a token', async () => {
    expect((await api('POST', `/recipes/${recipe.id}/like`)).status).toBe(401);
    expect((await api('DELETE', `/recipes/${recipe.id}/like`)).status).toBe(401);
  });

  it('returns 404 NOT_FOUND for an unknown recipe', async () => {
    const id = new ObjectId();

    expect((await api('POST', `/recipes/${id}/like`, { token: fan.token })).status).toBe(404);
    expect((await api('DELETE', `/recipes/${id}/like`, { token: fan.token })).status).toBe(404);
  });
});
