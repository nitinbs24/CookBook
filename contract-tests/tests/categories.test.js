import { describe, expect, it } from 'vitest';
import { api } from '../src/http.js';

describe('GET /categories', () => {
  it('returns an empty array when no recipes exist (categories with 0 recipes are left out)', async () => {
    const res = await api('GET', '/categories');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
