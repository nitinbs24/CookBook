import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '../api/admin.js';
import * as authApi from '../api/auth.js';
import * as recipesApi from '../api/recipes.js';
import { card, loginAs, page } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import Admin from './Admin.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/admin.js');
vi.mock('../api/recipes.js');

const adminCard = (o) => card({ author: { id: 'u1', name: 'Asha Rao', email: 'asha@recipebook.test' }, ...o });
beforeEach(() => {
  vi.resetAllMocks();
  loginAs(authApi, { id: 'a1', name: 'Admin', email: 'admin@x.co', role: 'admin', createdAt: '' });
  adminApi.adminRecipes.mockResolvedValue(page([adminCard({ title: 'Asha Paneer' })]));
  adminApi.adminUsers.mockResolvedValue(page([
    { id: 'u1', name: 'Asha Rao', email: 'asha@recipebook.test', role: 'user', createdAt: '2026-10-01T00:00:00.000Z', recipeCount: 6 },
  ]));
  adminApi.userRecipes.mockResolvedValue(page([adminCard({ title: 'Only Asha' })]));
});

describe('Admin page', () => {
  it('shows every recipe in a table with author email', async () => {
    renderApp(<Admin />, { route: '/admin', path: '/admin' });

    const row = (await screen.findByRole('cell', { name: 'Asha Paneer' })).closest('tr');
    expect(within(row).getByText('asha@recipebook.test')).toBeInTheDocument();
    expect(within(row).getByText('Veg')).toBeInTheDocument();
  });

  it('searches recipes by title', async () => {
    const user = userEvent.setup();
    renderApp(<Admin />, { route: '/admin', path: '/admin' });
    await screen.findByRole('cell', { name: 'Asha Paneer' });

    await user.type(screen.getByRole('searchbox', { name: /search recipes/i }), 'paneer{Enter}');

    await waitFor(() => expect(adminApi.adminRecipes).toHaveBeenLastCalledWith({ q: 'paneer', page: 1, limit: 12 }));
  });

  it('deletes a recipe after confirming and reloads the table', async () => {
    const user = userEvent.setup();
    recipesApi.deleteRecipe.mockResolvedValue();
    renderApp(<Admin />, { route: '/admin', path: '/admin' });

    await user.click(await screen.findByRole('button', { name: 'Delete Asha Paneer' }));
    await user.click(screen.getByRole('dialog').querySelector('.btn-danger'));

    await waitFor(() => expect(recipesApi.deleteRecipe).toHaveBeenCalledWith('r1'));
    await waitFor(() => expect(adminApi.adminRecipes).toHaveBeenCalledTimes(2));
  });

  it('lists users with role and recipe count, and opens one user’s recipes', async () => {
    const user = userEvent.setup();
    renderApp(<Admin />, { route: '/admin?tab=users', path: '/admin' });

    const row = (await screen.findByText('asha@recipebook.test')).closest('tr');
    expect(within(row).getByText('6')).toBeInTheDocument();
    expect(within(row).getByText('user')).toBeInTheDocument();
    await user.click(within(row).getByRole('link', { name: 'Asha Rao' }));

    expect(await screen.findByRole('cell', { name: 'Only Asha' })).toBeInTheDocument();
    expect(adminApi.userRecipes).toHaveBeenCalledWith('u1', { page: 1, limit: 12 });
  });
});
