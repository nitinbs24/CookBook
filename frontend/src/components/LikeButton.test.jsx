import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import * as likesApi from '../api/likes.js';
import { loginAs } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import LikeButton from './LikeButton.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/likes.js');
beforeEach(() => vi.resetAllMocks());

describe('LikeButton', () => {
  it('asks a guest to sign up instead of calling the API', async () => {
    const user = userEvent.setup();
    localStorage.setItem('rb_guest', 'true');
    renderApp(<LikeButton recipeId="r1" liked={false} count={3} />);

    await user.click(screen.getByRole('button', { name: /like/i }));

    expect(screen.getByRole('dialog', { name: /sign up to like/i })).toBeInTheDocument();
    expect(likesApi.like).not.toHaveBeenCalled();
  });

  it('flips to liked and bumps the count at once, then keeps the server count', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    let resolve;
    likesApi.like.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderApp(<LikeButton recipeId="r1" liked={false} count={3} />);
    await waitFor(() => expect(authApi.me).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Like (3 likes)' }));

    expect(screen.getByRole('button', { name: 'Unlike (4 likes)' })).toHaveAttribute('aria-pressed', 'true');
    resolve({ liked: true, likeCount: 10 });
    expect(await screen.findByRole('button', { name: 'Unlike (10 likes)' })).toBeInTheDocument();
    expect(likesApi.like).toHaveBeenCalledWith('r1');
  });

  it('reverts and shows a toast when the API call fails', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    likesApi.unlike.mockRejectedValue(new ApiError(0, 'NETWORK', 'Could not reach the server'));
    renderApp(<LikeButton recipeId="r1" liked count={4} />);
    await waitFor(() => expect(authApi.me).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Unlike (4 likes)' }));

    expect(await screen.findByRole('button', { name: 'Unlike (4 likes)' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Could not reach the server');
  });
});
