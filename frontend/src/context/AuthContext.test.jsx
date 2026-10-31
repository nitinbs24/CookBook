import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import { AuthProvider, useAuth } from './AuthContext.jsx';

vi.mock('../api/auth.js');
const asha = { id: 'u1', name: 'Asha', email: 'asha@example.com', role: 'user', createdAt: '2026-10-31T00:00:00.000Z' };
const setup = () => renderHook(() => useAuth(), { wrapper: AuthProvider });

beforeEach(() => vi.resetAllMocks());

describe('AuthContext', () => {
  it('starts logged out and not a guest', () => {
    const { result } = setup();

    expect(result.current).toMatchObject({ user: null, token: null, isGuest: false, loading: false });
  });

  it('login stores the token, sets the user, and leaves guest mode', async () => {
    localStorage.setItem('rb_guest', 'true');
    authApi.login.mockResolvedValue({ user: asha, token: 't1' });
    const { result } = setup();

    await act(() => result.current.login({ email: asha.email, password: 'password123' }));

    expect(result.current).toMatchObject({ user: asha, token: 't1', isGuest: false });
    expect(localStorage.getItem('rb_token')).toBe('t1');
    expect(localStorage.getItem('rb_guest')).toBeNull();
  });

  it('continueAsGuest survives a reload (stored as rb_guest)', () => {
    const { result } = setup();

    act(() => result.current.continueAsGuest());

    expect(result.current.isGuest).toBe(true);
    expect(setup().result.current.isGuest).toBe(true);
  });

  it('logout clears the token and guest mode', async () => {
    authApi.register.mockResolvedValue({ user: asha, token: 't1' });
    const { result } = setup();
    await act(() => result.current.register({ name: 'Asha', email: asha.email, password: 'password123' }));

    act(() => result.current.logout());

    expect(result.current).toMatchObject({ user: null, token: null, isGuest: false });
    expect(localStorage.getItem('rb_token')).toBeNull();
  });

  it('reloads the user from a stored token on start', async () => {
    localStorage.setItem('rb_token', 't1');
    authApi.me.mockResolvedValue(asha);

    const { result } = setup();

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(asha);
  });

  it('drops a stored token the server rejects with 401', async () => {
    localStorage.setItem('rb_token', 'expired');
    authApi.me.mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'Login required'));

    const { result } = setup();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('rb_token')).toBeNull();
  });

  it('keeps the token when the server is unreachable', async () => {
    localStorage.setItem('rb_token', 't1');
    authApi.me.mockRejectedValue(new ApiError(0, 'NETWORK', 'Could not reach the server'));

    const { result } = setup();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.token).toBe('t1');
  });
});
