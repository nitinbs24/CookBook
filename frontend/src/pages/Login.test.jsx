import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { renderApp } from '../test/render.jsx';
import Login from './Login.jsx';

vi.mock('../api/auth.js');
beforeEach(() => vi.resetAllMocks());

describe('Login page', () => {
  it('shows the generic server error for wrong credentials', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Email or password is incorrect'));
    renderApp(<Login />, { route: '/login' });

    await user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
  });

  it('requires both fields before calling the API', async () => {
    const user = userEvent.setup();
    renderApp(<Login />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('goes to /home after logging in', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValue({ user: { id: 'u1', name: 'Asha', role: 'user' }, token: 't1' });
    renderApp(<Login />, { route: '/login', path: '/login', extraRoutes: { '/home': 'home page' } });

    await user.type(screen.getByLabelText('Email'), 'asha@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('home page')).toBeInTheDocument();
  });
});
