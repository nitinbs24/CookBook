import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { resetDb } from '../src/db.js';
import { insertRecipes, recipeDoc } from '../src/fixtures.js';

describe('GET /categories', () => {
  it('returns an empty array when no recipes exist (categories with 0 recipes are left out)', async () => {
    const res = await api('GET', '/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  describe('with recipes', () => {
    beforeAll(async () => {
      await resetDb();
      await insertRecipes([
        recipeDoc({ category: 'paneer', foodType: 'veg' }),
        recipeDoc({ category: 'paneer', foodType: 'veg' }),
        recipeDoc({ category: 'chicken', foodType: 'nonveg' }),
        recipeDoc({ category: 'egg', foodType: 'nonveg' }),
        recipeDoc({ category: 'potato', foodType: 'veg' }),
      ]);
    });

    it('returns { slug, name, imageUrl, recipeCount } in tile order (Paneer, Chicken, Egg, Potato)', async () => {
      const res = await api('GET', '/categories');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        { slug: 'paneer', name: 'Paneer', imageUrl: null, recipeCount: 2 },
        { slug: 'chicken', name: 'Chicken', imageUrl: null, recipeCount: 1 },
        { slug: 'egg', name: 'Egg', imageUrl: null, recipeCount: 1 },
        { slug: 'potato', name: 'Potato', imageUrl: null, recipeCount: 1 },
      ]);
    });

    it('counts only veg recipes with ?foodType=veg, hiding categories that have none', async () => {
      const res = await api('GET', '/categories?foodType=veg');

      expect(res.body.map((c) => [c.slug, c.recipeCount])).toEqual([['paneer', 2], ['potato', 1]]);
    });

    it('counts only non-veg recipes with ?foodType=nonveg', async () => {
      const res = await api('GET', '/categories?foodType=nonveg');

      expect(res.body.map((c) => c.slug)).toEqual(['chicken', 'egg']);
    });

    it('returns 400 VALIDATION_ERROR for an unknown foodType', async () => {
      const res = await api('GET', '/categories?foodType=vegan');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
