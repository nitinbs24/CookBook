import { describe, expect, it } from 'vitest';
import { escapeRegex } from '../src/services/recipe.js';
import { listQuery, normalizeDish, recipeSchema, trendingQuery } from '../src/validators/index.js';

const validRecipe = {
  title: 'Paneer Tikka', dishName: 'Paneer Tikka', foodType: 'veg', category: 'paneer', difficulty: 'easy',
  servings: 2, prepTimeMin: 10, cookTimeMin: 20,
  images: [{ url: 'https://x.test/a.jpg', publicId: 'recipebook/a' }],
  ingredients: [{ name: 'Paneer' }],
  instructions: [{ steps: [{ text: 'Grill it.' }] }],
};

describe('normalizeDish', () => {
  it('trims and collapses inner whitespace, keeping case', () => {
    expect(normalizeDish('  Paneer \t Butter   Masala ')).toBe('Paneer Butter Masala');
  });
});

describe('escapeRegex', () => {
  it('escapes every regex metacharacter so the text matches literally', () => {
    const text = 'a.b*c+d?e^f$g(h)i[j]k{l}m|n\\o';
    expect(new RegExp(`^${escapeRegex(text)}$`).test(text)).toBe(true);
    expect(new RegExp(`^${escapeRegex('a.b')}$`).test('axb')).toBe(false);
  });
});

describe('recipeSchema', () => {
  it('fills missing optional fields with null and normalizes dishName', () => {
    const parsed = recipeSchema.parse({ ...validRecipe, dishName: ' Paneer  Tikka ' });

    expect(parsed).toMatchObject({ description: null, dishName: 'Paneer Tikka' });
    expect(parsed.ingredients[0]).toEqual({ name: 'Paneer', quantity: null, unit: null, note: null });
    expect(parsed.instructions[0]).toEqual({ section: null, steps: [{ text: 'Grill it.', durationMin: null, tip: null }] });
  });

  it('strips server-set fields', () => {
    const parsed = recipeSchema.parse({ ...validRecipe, author: 'x', likeCount: 9, avgRating: 5 });

    expect(parsed).not.toHaveProperty('author');
    expect(parsed).not.toHaveProperty('likeCount');
    expect(parsed).not.toHaveProperty('avgRating');
  });

  it('rejects a dishName that is under 2 chars once normalized', () => {
    expect(recipeSchema.safeParse({ ...validRecipe, dishName: '  a  ' }).success).toBe(false);
  });
});

describe('listQuery', () => {
  it('defaults to page 1, limit 12 and coerces numeric strings', () => {
    expect(listQuery.parse({})).toEqual({ page: 1, limit: 12 });
    expect(listQuery.parse({ page: '3', limit: '50' })).toMatchObject({ page: 3, limit: 50 });
  });

  it('rejects limit above 50', () => {
    expect(listQuery.safeParse({ limit: '51' }).success).toBe(false);
  });
});

describe('trendingQuery', () => {
  it('defaults to 7 days and 10 recipes', () => {
    expect(trendingQuery.parse({})).toEqual({ days: 7, limit: 10 });
  });
});
