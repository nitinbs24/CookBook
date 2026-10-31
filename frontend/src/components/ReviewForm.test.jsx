import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import * as reviewsApi from '../api/reviews.js';
import { loginAs, review } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import ReviewForm from './ReviewForm.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/reviews.js');
beforeEach(() => vi.resetAllMocks());

describe('ReviewForm', () => {
  it('requires a rating before calling the API', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    renderApp(<ReviewForm recipeId="r1" onPosted={vi.fn()} />);
    await waitFor(() => expect(authApi.me).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Post review' }));

    expect(screen.getByRole('radiogroup', { name: 'Rating' })).toHaveAccessibleDescription(/choose a rating/i);
    expect(reviewsApi.createReview).not.toHaveBeenCalled();
  });

  it('posts the rating and trimmed comment, then reports back', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    const onPosted = vi.fn();
    reviewsApi.createReview.mockResolvedValue(review({ rating: 4 }));
    renderApp(<ReviewForm recipeId="r1" onPosted={onPosted} />);
    await waitFor(() => expect(authApi.me).toHaveBeenCalled());

    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    await user.type(screen.getByLabelText(/comment/i), '  Lovely  ');
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    await waitFor(() => expect(onPosted).toHaveBeenCalled());
    expect(reviewsApi.createReview).toHaveBeenCalledWith('r1', { rating: 4, comment: 'Lovely' });
  });

  it('treats a 409 as already reviewed', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    const onPosted = vi.fn();
    reviewsApi.createReview.mockRejectedValue(new ApiError(409, 'CONFLICT', 'You already reviewed this recipe'));
    renderApp(<ReviewForm recipeId="r1" onPosted={onPosted} />);
    await waitFor(() => expect(authApi.me).toHaveBeenCalled());

    await user.click(screen.getByRole('radio', { name: '5 stars' }));
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    await waitFor(() => expect(onPosted).toHaveBeenCalled());
  });

  it('asks a guest to sign up', async () => {
    const user = userEvent.setup();
    localStorage.setItem('rb_guest', 'true');
    renderApp(<ReviewForm recipeId="r1" onPosted={vi.fn()} />);

    await user.click(screen.getByRole('radio', { name: '5 stars' }));
    await user.click(screen.getByRole('button', { name: 'Post review' }));

    expect(screen.getByRole('dialog', { name: /sign up/i })).toBeInTheDocument();
    expect(reviewsApi.createReview).not.toHaveBeenCalled();
  });
});
