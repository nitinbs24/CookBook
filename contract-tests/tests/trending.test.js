import { ObjectId } from 'mongodb';
import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { authorWithRecipes, daysAgo, insertLikes } from '../src/fixtures.js';

const titles = (res) => res.body.map((r) => r.title);
const times = (n, recipe, createdAt) => Array.from({ length: n }, () => ({ recipe, createdAt }));

describe('GET /recipes/trending', () => {
  let author;
  beforeAll(async () => {
    author = await authorWithRecipes([
      { _id: new ObjectId(), title: 'Veg Two', foodType: 'veg' },
      { _id: new ObjectId(), title: 'Nonveg Three', foodType: 'nonveg', category: 'chicken' },
      { _id: new ObjectId(), title: 'Veg Old Favourite', foodType: 'veg' },
      { _id: new ObjectId(), title: 'Never Liked', foodType: 'veg' },
    ]);
    const [vegTwo, nonvegThree, oldFav] = author.recipes.map((r) => r._id);
    await insertLikes([
      ...times(2, vegTwo, daysAgo(1)),
      ...times(3, nonvegThree, daysAgo(2)),
      ...times(1, oldFav, daysAgo(3)),
      ...times(5, oldFav, daysAgo(9)), // outside the default 7 days
    ]);
  });

  it('returns recipes ordered by likes in the last 7 days, as cards with weekLikes', async () => {
    const res = await api('GET', '/recipes/trending');

    expect(res.status).toBe(200);
    expect(res.body.map((r) => [r.title, r.weekLikes])).toEqual([['Nonveg Three', 3], ['Veg Two', 2], ['Veg Old Favourite', 1]]);
    expect(Object.keys(res.body[0]).sort()).toEqual([
      'author', 'avgRating', 'category', 'createdAt', 'dishName', 'foodType', 'id', 'image', 'likeCount',
      'reviewCount', 'title', 'weekLikes',
    ]);
    expect(res.body[0].author).toEqual({ id: author.user.id, name: author.user.name });
  });

  it('filters by foodType after counting', async () => {
    const res = await api('GET', '/recipes/trending?foodType=veg');

    expect(titles(res)).toEqual(['Veg Two', 'Veg Old Favourite']);
  });

  it('widens the window with days', async () => {
    const res = await api('GET', '/recipes/trending?days=10');

    expect(res.body[0]).toMatchObject({ title: 'Veg Old Favourite', weekLikes: 6 });
  });

  it('caps the list with limit', async () => {
    const res = await api('GET', '/recipes/trending?limit=1');

    expect(titles(res)).toEqual(['Nonveg Three']);
  });

  it('is not mistaken for a recipe id (route order)', async () => {
    const res = await api('GET', '/recipes/trending');

    expect(Array.isArray(res.body)).toBe(true);
  });
});
