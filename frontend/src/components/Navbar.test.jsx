import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext.jsx';
import { FoodTypeProvider } from '../context/FoodTypeContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { ProtectedRoute } from './RouteGuards.jsx';
import * as authApi from '../api/auth.js';
import { loginAs } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import Navbar from './Navbar.jsx';

vi.mock('../api/auth.js');

describe('Navbar', () => {
  it('has a Both / Veg / Non-veg radio group, Both by default, and remembers a change', async () => {
    const user = userEvent.setup();
    renderApp(<Navbar />);

    expect(screen.getByRole('radio', { name: 'Both' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Veg' }));

    expect(screen.getByRole('radio', { name: 'Veg' })).toBeChecked();
    expect(localStorage.getItem('rb_foodType')).toBe('veg');
  });

  it('moves between food types with the arrow keys', async () => {
    const user = userEvent.setup();
    renderApp(<Navbar />);
    await user.click(screen.getByRole('radio', { name: 'Both' }));

    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Veg' })).toBeChecked();
  });

  it('cycles the theme system → light → dark with a labelled button', async () => {
    const user = userEvent.setup();
    renderApp(<Navbar />);

    await user.click(screen.getByRole('button', { name: /theme: system/i }));
    await user.click(screen.getByRole('button', { name: /theme: light/i }));

    expect(screen.getByRole('button', { name: /theme: dark/i })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('shows Log in and Sign up to a guest', () => {
    localStorage.setItem('rb_guest', 'true');
    renderApp(<Navbar />);

    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register');
  });

  it('gives a logged-in user Add recipe and an account menu with their lists', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    renderApp(<Navbar />);

    expect(await screen.findByRole('link', { name: 'Add recipe' })).toHaveAttribute('href', '/recipes/new');
    await user.click(screen.getByText('Meera'));
    expect(screen.getByRole('link', { name: 'My recipes' })).toHaveAttribute('href', '/me/recipes');
    expect(screen.getByRole('link', { name: 'Want to try' })).toHaveAttribute('href', '/me/likes');
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('closes the account menu on Escape and returns focus to it', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    renderApp(<Navbar />);
    await user.click(await screen.findByText('Meera'));
    expect(screen.getByRole('link', { name: 'My recipes' })).toBeVisible();

    await user.keyboard('{Escape}');

    expect(document.querySelector('header details').open).toBe(false);
    expect(document.activeElement).toBe(document.querySelector('header summary'));
  });

  it('shows the Admin link to admins only', async () => {
    loginAs(authApi, { id: 'a1', name: 'Boss', email: 'b@x.co', role: 'admin', createdAt: '' });
    renderApp(<Navbar />);

    expect(await screen.findByRole('link', { name: 'Admin', hidden: true })).toHaveAttribute('href', '/admin');
  });

  it('logging out from a protected page goes to the landing page, not /login', async () => {
    const user = userEvent.setup();
    loginAs(authApi);
    render(
      <ThemeProvider>
        <AuthProvider>
          <FoodTypeProvider>
            <MemoryRouter initialEntries={['/me/likes']}>
              <Navbar />
              <Routes>
                <Route path="/" element={<p>landing page</p>} />
                <Route path="/login" element={<p>login page</p>} />
                <Route element={<ProtectedRoute />}><Route path="/me/likes" element={<p>want to try</p>} /></Route>
              </Routes>
            </MemoryRouter>
          </FoodTypeProvider>
        </AuthProvider>
      </ThemeProvider>,
    );
    await screen.findByText('want to try');

    await user.click(screen.getByText('Meera'));
    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(await screen.findByText('landing page')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});

