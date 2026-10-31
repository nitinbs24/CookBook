import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import * as recipesApi from '../api/recipes.js';
import * as reviewsApi from '../api/reviews.js';
import { fullRecipe, loginAs, page, review } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import RecipeDetail from './RecipeDetail.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/recipes.js');
vi.mock('../api/reviews.js');
vi.mock('../api/likes.js');

beforeEach(() => {
  vi.resetAllMocks();
  recipesApi.getRecipe.mockResolvedValue(fullRecipe());
  reviewsApi.listReviews.mockResolvedValue(page([review()]));
});

const renderDetail = () =>
  renderApp(<RecipeDetail />, { route: '/recipes/r1', path: '/recipes/:id', extraRoutes: { '/home': 'home page' } });

describe('Recipe page', () => {
  it('shows details, ingredients, sectioned steps with tips, and reviews', async () => {
    localStorage.setItem('rb_guest', 'true');
    renderDetail();

    expect(await screen.findByRole('heading', { level: 1, name: 'Dhaba-style Paneer Butter Masala' })).toBeInTheDocument();
    expect(screen.getByText('250 g')).toBeInTheDocument();
    expect(screen.getByText('to taste')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gravy' })).toBeInTheDocument();
    expect(screen.getByText('Do not rush.')).toBeInTheDocument();
    expect(screen.getByText('8 min')).toBeInTheDocument();
    expect(await screen.findByText('Perfect gravy.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete recipe/i })).not.toBeInTheDocument();
  });

  it('swaps the cover image when a thumbnail is clicked', async () => {
    const user = userEvent.setup();
    localStorage.setItem('rb_guest', 'true');
    renderDetail();
    await screen.findByRole('heading', { level: 1 });

    await user.click(screen.getByRole('button', { name: /photo 2/i }));

    expect(screen.getByRole('img', { name: 'Dhaba-style Paneer Butter Masala' })).toHaveAttribute('src', 'https://img.test/pbm2.jpg');
  });

  it('lets the author delete the recipe after confirming, then goes home', async () => {
    const user = userEvent.setup();
    loginAs(authApi, { id: 'u1', name: 'Asha Rao', email: 'a@x.co', role: 'user', createdAt: '' });
    recipesApi.deleteRecipe.mockResolvedValue();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /delete recipe/i }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('home page')).toBeInTheDocument();
    expect(recipesApi.deleteRecipe).toHaveBeenCalledWith('r1');
  });

  it('hides the review form from the author', async () => {
    loginAs(authApi, { id: 'u1', name: 'Asha Rao', email: 'a@x.co', role: 'user', createdAt: '' });
    renderDetail();

    await screen.findByRole('button', { name: /delete recipe/i });
    expect(screen.queryByRole('button', { name: 'Post review' })).not.toBeInTheDocument();
  });

  it('lets an admin delete any review after confirming', async () => {
    const user = userEvent.setup();
    loginAs(authApi, { id: 'a1', name: 'Admin', email: 'admin@x.co', role: 'admin', createdAt: '' });
    reviewsApi.deleteReview.mockResolvedValue();
    renderDetail();

    await user.click(await screen.findByRole('button', { name: /delete review by ravi kumar/i }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(reviewsApi.deleteReview).toHaveBeenCalledWith('rv1'));
  });

  it('shows "Recipe not found" for a 404', async () => {
    localStorage.setItem('rb_guest', 'true');
    recipesApi.getRecipe.mockRejectedValue(new ApiError(404, 'NOT_FOUND', 'Recipe not found'));
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Recipe not found' })).toBeInTheDocument();
  });
});
