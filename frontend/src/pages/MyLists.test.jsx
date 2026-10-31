import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import * as likesApi from '../api/likes.js';
import * as recipesApi from '../api/recipes.js';
import { card, loginAs, page } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import { MyRecipes, WantToTry } from './MyLists.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/recipes.js');
vi.mock('../api/likes.js');
beforeEach(() => {
  vi.resetAllMocks();
  loginAs(authApi);
});

describe('My recipes', () => {
  it('lists my recipes with the toggle applied', async () => {
    localStorage.setItem('rb_foodType', 'nonveg');
    recipesApi.myRecipes.mockResolvedValue(page([card({ title: 'My Egg Curry' })]));
    renderApp(<MyRecipes />, { route: '/me/recipes' });

    expect(await screen.findByRole('link', { name: 'My Egg Curry' })).toBeInTheDocument();
    expect(recipesApi.myRecipes).toHaveBeenCalledWith({ foodType: 'nonveg', page: 1, limit: 12 });
  });

  it('invites me to add a recipe when I have none', async () => {
    recipesApi.myRecipes.mockResolvedValue(page([]));
    renderApp(<MyRecipes />, { route: '/me/recipes' });

    expect(await screen.findByRole('link', { name: 'Add recipe' })).toHaveAttribute('href', '/recipes/new');
  });
});

describe('Want to try', () => {
  it('lists liked recipes', async () => {
    likesApi.myLikes.mockResolvedValue(page([card({ title: 'Liked Biryani' })]));
    renderApp(<WantToTry />, { route: '/me/likes' });

    expect(await screen.findByRole('link', { name: 'Liked Biryani' })).toBeInTheDocument();
    await waitFor(() => expect(likesApi.myLikes).toHaveBeenCalledWith({ foodType: undefined, page: 1, limit: 12 }));
  });

  it('points to browsing when nothing is liked yet', async () => {
    likesApi.myLikes.mockResolvedValue(page([]));
    renderApp(<WantToTry />, { route: '/me/likes' });

    expect(await screen.findByRole('link', { name: 'Browse recipes' })).toHaveAttribute('href', '/home');
  });
});
