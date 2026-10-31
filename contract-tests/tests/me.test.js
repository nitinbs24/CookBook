import { ObjectId } from 'mongodb';
import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { authorWithRecipes, daysAgo, insertLikes, registerUser } from '../src/fixtures.js';

const titles = (res) => res.body.items.map((r) => r.title);

describe('GET /me/likes (Want to try)', () => {
  let fan;
  beforeAll(async () => {
    const { recipes } = await authorWithRecipes([
      { _id: new ObjectId(), title: 'Liked Long Ago', foodType: 'veg' },
      { _id: new ObjectId(), title: 'Liked Yesterday', foodType: 'nonveg', category: 'chicken' },
      { _id: new ObjectId(), title: 'Liked Today', foodType: 'veg' },
      { _id: new ObjectId(), title: 'Not Liked', foodType: 'veg' },
    ]);
    fan = await registerUser();
    const user = new ObjectId(fan.user.id);
    await insertLikes([
      { recipe: recipes[0]._id, user, createdAt: daysAgo(10) },
      { recipe: recipes[1]._id, user, createdAt: daysAgo(1) },
      { recipe: recipes[2]._id, user, createdAt: new Date() },
      { recipe: recipes[3]._id }, // someone else's like
    ]);
  });

  it('returns a page of cards, most recently liked first', async () => {
    const res = await api('GET', '/me/likes', { token: fan.token });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ page: 1, limit: 12, total: 3 });
    expect(titles(res)).toEqual(['Liked Today', 'Liked Yesterday', 'Liked Long Ago']);
    expect(res.body.items[0]).toHaveProperty('image');
    expect(res.body.items[0]).not.toHaveProperty('ingredients');
  });

  it('filters by foodType', async () => {
    const res = await api('GET', '/me/likes?foodType=veg', { token: fan.token });

    expect(titles(res)).toEqual(['Liked Today', 'Liked Long Ago']);
    expect(res.body.total).toBe(2);
  });

  it('paginates', async () => {
    const res = await api('GET', '/me/likes?page=2&limit=2', { token: fan.token });

    expect(titles(res)).toEqual(['Liked Long Ago']);
  });

  it('returns 401 without a token', async () => {
    expect((await api('GET', '/me/likes')).status).toBe(401);
  });
});

describe('GET /me/recipes', () => {
  let me;
  beforeAll(async () => {
    me = await authorWithRecipes([
      { title: 'My Older Dish', foodType: 'nonveg', category: 'egg', createdAt: daysAgo(3) },
      { title: 'My Newer Dish', foodType: 'veg', createdAt: daysAgo(1) },
    ]);
    await authorWithRecipes([{ title: 'Someone Else' }]);
  });

  it('returns only my recipes, newest first', async () => {
    const res = await api('GET', '/me/recipes', { token: me.token });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2 });
    expect(titles(res)).toEqual(['My Newer Dish', 'My Older Dish']);
  });

  it('respects the foodType toggle (PRD F-11)', async () => {
    const res = await api('GET', '/me/recipes?foodType=nonveg', { token: me.token });

    expect(titles(res)).toEqual(['My Older Dish']);
  });

  it('returns 401 without a token', async () => {
    expect((await api('GET', '/me/recipes')).status).toBe(401);
  });
});
