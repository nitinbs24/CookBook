import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { card } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import RecipeCard from './RecipeCard.jsx';
import VegMark from './VegMark.jsx';

vi.mock('../api/auth.js');

describe('VegMark', () => {
  it.each([
    ['veg', 'Veg'],
    ['nonveg', 'Non-veg'],
  ])('always shows a text label for %s, never colour alone', (foodType, label) => {
    renderApp(<VegMark foodType={foodType} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('RecipeCard', () => {
  it('links the title to the recipe and shows cover, dish, rating, likes, author, and veg mark', () => {
    renderApp(<RecipeCard recipe={card()} />);

    expect(screen.getByRole('link', { name: 'Dhaba-style Paneer Butter Masala' })).toHaveAttribute('href', '/recipes/r1');
    expect(screen.getByRole('img', { name: 'Dhaba-style Paneer Butter Masala' })).toHaveAttribute('src', 'https://img.test/pbm.jpg');
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(12)')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.getByText('by Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Veg')).toBeInTheDocument();
  });

  it('links the dish name to every version of that dish in its category', () => {
    renderApp(<RecipeCard recipe={card()} />);

    expect(screen.getByRole('link', { name: 'Paneer Butter Masala' })).toHaveAttribute(
      'href',
      '/category/paneer?dish=Paneer+Butter+Masala',
    );
  });
});
