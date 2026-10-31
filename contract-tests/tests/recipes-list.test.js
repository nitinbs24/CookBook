import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { authorWithRecipes, daysAgo } from '../src/fixtures.js';

const CARD_KEYS = [
  'author', 'avgRating', 'category', 'createdAt', 'dishName', 'foodType', 'id', 'image', 'likeCount',
  'reviewCount', 'title',
];
const titles = (res) => res.body.items.map((r) => r.title);

describe('GET /recipes', () => {
  let author;
  beforeAll(async () => {
    author = await authorWithRecipes([
      { title: 'Paneer Tikka', dishName: 'Paneer Tikka', category: 'paneer', foodType: 'veg', createdAt: daysAgo(1) },
      { title: 'Shahi Paneer', dishName: 'Paneer Butter Masala', category: 'paneer', foodType: 'veg', createdAt: daysAgo(2) },
      { title: 'Butter Chicken', dishName: 'Butter Chicken', category: 'chicken', foodType: 'nonveg', createdAt: daysAgo(3) },
      { title: 'Masala Omelette', dishName: 'Omelette', category: 'egg', foodType: 'nonveg', createdAt: daysAgo(4) },
      { title: 'Mom Style PBM', dishName: 'paneer butter masala', category: 'paneer', foodType: 'veg', createdAt: daysAgo(5),
        images: [{ url: 'https://x.test/1.jpg', publicId: 'recipebook/1' }, { url: 'https://x.test/2.jpg', publicId: 'recipebook/2' }] },
      { title: 'Dot Test', dishName: 'Paneer.Masala', category: 'paneer', foodType: 'veg', createdAt: daysAgo(6) },
    ]);
  });

  it('returns a page of cards, newest first, with { items, page, limit, total }', async () => {
    const res = await api('GET', '/recipes');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['items', 'limit', 'page', 'total']);
    expect(res.body).toMatchObject({ page: 1, limit: 12, total: 6 });
    expect(titles(res)).toEqual(['Paneer Tikka', 'Shahi Paneer', 'Butter Chicken', 'Masala Omelette', 'Mom Style PBM', 'Dot Test']);
  });

  it('returns cards with exactly the card fields, the first image, and author { id, name }', async () => {
    const res = await api('GET', '/recipes');
    const card = res.body.items.find((r) => r.title === 'Mom Style PBM');

    expect(Object.keys(card).sort()).toEqual(CARD_KEYS);
    expect(card.image).toEqual({ url: 'https://x.test/1.jpg', publicId: 'recipebook/1' });
    expect(card.author).toEqual({ id: author.user.id, name: author.user.name });
  });

  it('paginates with page and limit', async () => {
    const res = await api('GET', '/recipes?page=2&limit=4');

    expect(res.body).toMatchObject({ page: 2, limit: 4, total: 6 });
    expect(titles(res)).toEqual(['Mom Style PBM', 'Dot Test']);
  });

  it('filters by foodType', async () => {
    const res = await api('GET', '/recipes?foodType=nonveg');

    expect(titles(res)).toEqual(['Butter Chicken', 'Masala Omelette']);
    expect(res.body.total).toBe(2);
  });

  it('filters by category combined with foodType', async () => {
    const res = await api('GET', '/recipes?category=paneer&foodType=veg');

    expect(res.body.total).toBe(4);
  });

  it('filters by dish name case-insensitively and exactly', async () => {
    const res = await api('GET', `/recipes?dish=${encodeURIComponent('  PANEER butter   masala ')}`);

    expect(titles(res)).toEqual(['Shahi Paneer', 'Mom Style PBM']);
  });

  it('treats regex characters in dish literally', async () => {
    const res = await api('GET', `/recipes?dish=${encodeURIComponent('Paneer.Masala')}`);
    const wildcard = await api('GET', `/recipes?dish=${encodeURIComponent('Paneer Tikk.')}`);

    expect(titles(res)).toEqual(['Dot Test']);
    expect(wildcard.body.total).toBe(0);
  });

  it('searches title and dish name with q', async () => {
    const res = await api('GET', '/recipes?q=omelette');

    expect(titles(res)).toEqual(['Masala Omelette']);
  });

  it('combines q with foodType', async () => {
    const res = await api('GET', '/recipes?q=butter&foodType=nonveg');

    expect(titles(res)).toEqual(['Butter Chicken']);
  });

  it.each([
    ['limit over 50', 'limit=51'],
    ['limit 0', 'limit=0'],
    ['page 0', 'page=0'],
    ['a non-numeric page', 'page=abc'],
    ['an unknown foodType', 'foodType=vegan'],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, query) => {
    const res = await api('GET', `/recipes?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
