import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as recipesApi from '../api/recipes.js';
import { card, page } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import Category from './Category.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/recipes.js');

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.setItem('rb_guest', 'true');
  recipesApi.listRecipes.mockResolvedValue(page([card(), card({ id: 'r2', title: 'Mom Style PBM' })]));
});

describe('Category page', () => {
  it('shows the category name and its recipes, filtered by the toggle', async () => {
    localStorage.setItem('rb_foodType', 'veg');
    renderApp(<Category />, { route: '/category/paneer', path: '/category/:slug' });

    expect(await screen.findByRole('heading', { level: 1, name: /paneer/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mom Style PBM' })).toBeInTheDocument();
    expect(recipesApi.listRecipes).toHaveBeenCalledWith({ category: 'paneer', dish: undefined, foodType: 'veg', page: 1, limit: 12 });
  });

  it('filters by dish from ?dish and clears it with the chip', async () => {
    const user = userEvent.setup();
    renderApp(<Category />, { route: '/category/paneer?dish=Paneer%20Butter%20Masala', path: '/category/:slug' });

    await waitFor(() => expect(recipesApi.listRecipes).toHaveBeenCalledWith(expect.objectContaining({ dish: 'Paneer Butter Masala' })));
    await user.click(screen.getByRole('button', { name: /clear dish filter/i }));

    await waitFor(() => expect(recipesApi.listRecipes).toHaveBeenLastCalledWith(expect.objectContaining({ dish: undefined })));
  });
});
