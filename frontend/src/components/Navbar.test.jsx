import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
});
