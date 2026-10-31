import { ObjectId } from 'mongodb';
import { beforeAll, describe, expect, it } from 'vitest';
import { api } from '../src/http.js';
import { authorWithRecipes, daysAgo, registerAdmin, registerUser } from '../src/fixtures.js';

const titles = (res) => res.body.items.map((r) => r.title);

describe('admin endpoints', () => {
  let admin;
  let asha;
  let ravi;
  let plain;
  beforeAll(async () => {
    asha = await authorWithRecipes([
      { title: 'Asha Paneer Tikka', createdAt: daysAgo(1) },
      { title: 'Asha Egg Curry', foodType: 'nonveg', category: 'egg', createdAt: daysAgo(3) },
    ]);
    ravi = await authorWithRecipes([{ title: 'Ravi Butter Chicken', foodType: 'nonveg', category: 'chicken', createdAt: daysAgo(2) }]);
    plain = await registerUser();
    admin = await registerAdmin();
  });

  describe('access', () => {
    it.each(['/admin/recipes', '/admin/users', `/admin/users/${new ObjectId()}/recipes`])(
      '%s returns 403 FORBIDDEN for a normal user and 401 without a token',
      async (path) => {
        const forbidden = await api('GET', path, { token: plain.token });
        const anonymous = await api('GET', path);

        expect(forbidden.status).toBe(403);
        expect(forbidden.body.error.code).toBe('FORBIDDEN');
        expect(anonymous.status).toBe(401);
      },
    );
  });

  describe('GET /admin/recipes', () => {
    it('returns every user’s recipes, newest first, as cards with author.email', async () => {
      const res = await api('GET', '/admin/recipes', { token: admin.token });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ page: 1, limit: 12, total: 3 });
      expect(titles(res)).toEqual(['Asha Paneer Tikka', 'Ravi Butter Chicken', 'Asha Egg Curry']);
      expect(res.body.items[0].author).toEqual({ id: asha.user.id, name: asha.user.name, email: asha.user.email });
    });

    it('searches by title with q', async () => {
      const res = await api('GET', '/admin/recipes?q=chicken', { token: admin.token });

      expect(titles(res)).toEqual(['Ravi Butter Chicken']);
    });

    it('paginates', async () => {
      const res = await api('GET', '/admin/recipes?page=2&limit=2', { token: admin.token });

      expect(titles(res)).toEqual(['Asha Egg Curry']);
    });
  });

  describe('GET /admin/users', () => {
    it('returns users, newest first, with recipeCount and no passwordHash', async () => {
      const res = await api('GET', '/admin/users', { token: admin.token });

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(4);
      expect(res.body.items.map((u) => [u.email, u.recipeCount, u.role])).toEqual([
        [admin.user.email, 0, 'admin'],
        [plain.user.email, 0, 'user'],
        [ravi.user.email, 1, 'user'],
        [asha.user.email, 2, 'user'],
      ]);
      expect(Object.keys(res.body.items[0]).sort()).toEqual(['createdAt', 'email', 'id', 'name', 'recipeCount', 'role']);
    });
  });

  describe('GET /admin/users/:id/recipes', () => {
    it('returns one user’s recipes as cards, newest first', async () => {
      const res = await api('GET', `/admin/users/${asha.user.id}/recipes`, { token: admin.token });

      expect(res.status).toBe(200);
      expect(titles(res)).toEqual(['Asha Paneer Tikka', 'Asha Egg Curry']);
    });

    it('returns 404 for an unknown user', async () => {
      const res = await api('GET', `/admin/users/${new ObjectId()}/recipes`, { token: admin.token });

      expect(res.status).toBe(404);
    });
  });
});
