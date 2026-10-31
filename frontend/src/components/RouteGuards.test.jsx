import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { AuthProvider } from '../context/AuthContext.jsx';
import { FoodTypeProvider } from '../context/FoodTypeContext.jsx';
import Landing from '../pages/Landing.jsx';
import { AdminRoute, ProtectedRoute, SessionRoute } from './RouteGuards.jsx';

vi.mock('../api/auth.js');
beforeEach(() => vi.resetAllMocks());

function renderAt(route) {
  return render(
    <AuthProvider>
      <FoodTypeProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<p>login page</p>} />
            <Route element={<SessionRoute />}><Route path="/home" element={<p>home page</p>} /></Route>
            <Route element={<ProtectedRoute />}><Route path="/me/recipes" element={<p>my recipes page</p>} /></Route>
            <Route element={<AdminRoute />}><Route path="/admin" element={<p>admin page</p>} /></Route>
          </Routes>
        </MemoryRouter>
      </FoodTypeProvider>
    </AuthProvider>,
  );
}
const loginAs = (role) => {
  localStorage.setItem('rb_token', 't');
  authApi.me.mockResolvedValue({ id: 'u1', name: 'A', email: 'a@x.co', role, createdAt: '' });
};

describe('route guards', () => {
  it('/home sends a visitor with no session to the landing page', async () => {
    renderAt('/home');

    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/cook/i);
  });

  it('/home lets a guest in', async () => {
    localStorage.setItem('rb_guest', 'true');

    renderAt('/home');

    expect(await screen.findByText('home page')).toBeInTheDocument();
  });

  it('the landing page sends a returning guest straight to /home', async () => {
    localStorage.setItem('rb_guest', 'true');

    renderAt('/');

    expect(await screen.findByText('home page')).toBeInTheDocument();
  });

  it('a user-only page sends a guest to /login', async () => {
    localStorage.setItem('rb_guest', 'true');

    renderAt('/me/recipes');

    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('a user-only page lets a logged-in user in', async () => {
    loginAs('user');

    renderAt('/me/recipes');

    expect(await screen.findByText('my recipes page')).toBeInTheDocument();
  });

  it('/admin sends a normal user to /home', async () => {
    loginAs('user');

    renderAt('/admin');

    expect(await screen.findByText('home page')).toBeInTheDocument();
  });

  it('/admin lets an admin in', async () => {
    loginAs('admin');

    renderAt('/admin');

    expect(await screen.findByText('admin page')).toBeInTheDocument();
  });
});
