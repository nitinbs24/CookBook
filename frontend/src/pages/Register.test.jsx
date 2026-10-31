import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { renderApp } from '../test/render.jsx';
import Register from './Register.jsx';

vi.mock('../api/auth.js');
beforeEach(() => vi.resetAllMocks());

const fill = async (user, { name = 'Asha', email = 'asha@example.com', password = 'password123' } = {}) => {
  if (name) await user.type(screen.getByLabelText('Name'), name);
  if (email) await user.type(screen.getByLabelText('Email'), email);
  if (password) await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Create account' }));
};

describe('Register page', () => {
  it('shows inline errors under each invalid field and does not call the API', async () => {
    const user = userEvent.setup();
    renderApp(<Register />, { route: '/register' });

    await fill(user, { name: 'A', email: 'not-an-email', password: 'short' });

    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(/at least 2/i);
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(/valid email/i);
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(/at least 8/i);
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('shows the server message on the email field for a duplicate email', async () => {
    const user = userEvent.setup();
    authApi.register.mockRejectedValue(new ApiError(409, 'CONFLICT', 'Email is already registered'));
    renderApp(<Register />, { route: '/register' });

    await fill(user);

    expect(await screen.findByText('Email is already registered')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a server validation error under the field it names', async () => {
    const user = userEvent.setup();
    authApi.register.mockRejectedValue(new ApiError(400, 'VALIDATION_ERROR', 'email: Invalid email address'));
    renderApp(<Register />, { route: '/register' });

    await fill(user, { email: 'asha@mail.c' });

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Invalid email address');
  });

  it('logs the user in and goes to /home on success', async () => {
    const user = userEvent.setup();
    authApi.register.mockResolvedValue({ user: { id: 'u1', name: 'Asha', role: 'user' }, token: 't1' });
    renderApp(<Register />, { route: '/register', path: '/register', extraRoutes: { '/home': 'home page' } });

    await fill(user);

    expect(await screen.findByText('home page')).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledWith({ name: 'Asha', email: 'asha@example.com', password: 'password123' });
    expect(localStorage.getItem('rb_token')).toBe('t1');
  });
});
