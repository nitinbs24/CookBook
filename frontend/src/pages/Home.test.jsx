import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as recipesApi from '../api/recipes.js';
import Navbar from '../components/Navbar.jsx';
import { card, page } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import Home from './Home.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/recipes.js');

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.setItem('rb_guest', 'true');
  recipesApi.trending.mockResolvedValue([{ ...card({ id: 't1', title: 'Trending Biryani' }), weekLikes: 9 }]);
  recipesApi.categories.mockResolvedValue([{ slug: 'paneer', name: 'Paneer', imageUrl: null, recipeCount: 4 }]);
  recipesApi.listRecipes.mockResolvedValue(page([card({ id: 'l1', title: 'Latest Dal' })], { total: 30 }));
});

const renderHome = () => renderApp(<><Navbar /><Home /></>, { route: '/home' });

describe('Home page', () => {
  it('shows trending recipes, category tiles with counts, and the latest recipes', async () => {
    renderHome();

    expect(await screen.findByRole('link', { name: 'Trending Biryani' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /paneer.*4 recipes/i })).toHaveAttribute('href', '/category/paneer');
    expect(screen.getByRole('link', { name: 'Latest Dal' })).toBeInTheDocument();
    expect(recipesApi.listRecipes).toHaveBeenCalledWith({ foodType: undefined, q: undefined, page: 1, limit: 12 });
  });

  it('refetches every list with foodType when the toggle changes', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByRole('link', { name: 'Latest Dal' });

    await user.click(screen.getByRole('radio', { name: 'Veg' }));

    await waitFor(() => expect(recipesApi.listRecipes).toHaveBeenLastCalledWith(expect.objectContaining({ foodType: 'veg' })));
    expect(recipesApi.trending).toHaveBeenLastCalledWith({ foodType: 'veg' });
    expect(recipesApi.categories).toHaveBeenLastCalledWith({ foodType: 'veg' });
  });

  it('searches after typing stops', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByRole('link', { name: 'Latest Dal' });

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'dal');

    await waitFor(() => expect(recipesApi.listRecipes).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'dal', page: 1 })));
  });

  it('clears the search box when the URL loses ?q (browser Back), and does not re-apply it', async () => {
    renderApp(<><Navbar /><Home /></>, { route: '/home?q=dal' });
    const box = await screen.findByRole('searchbox', { name: /search/i });
    expect(box).toHaveValue('dal');

    await act(() => window.__testNavigate('/home'));

    await waitFor(() => expect(box).toHaveValue(''));
    await new Promise((r) => setTimeout(r, 400)); // longer than the 300 ms debounce
    expect(recipesApi.listRecipes).toHaveBeenLastCalledWith(expect.objectContaining({ q: undefined }));
  });

  it('pages through the latest recipes', async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByRole('link', { name: 'Latest Dal' });

    await user.click(screen.getByRole('link', { name: 'Page 2' }));

    await waitFor(() => expect(recipesApi.listRecipes).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })));
  });

  it('shows an empty state when nothing matches', async () => {
    recipesApi.listRecipes.mockResolvedValue(page([]));
    renderHome();

    expect(await screen.findByText(/no recipes/i)).toBeInTheDocument();
  });
});
