import { describe, expect, it } from 'vitest';
import { categoryName } from './categories.js';

describe('categoryName', () => {
  it('uses the real name, keeping the ampersand', () => {
    expect(categoryName('rice-biryani')).toBe('Rice & Biryani');
  });

  it('falls back to a title-cased slug for an unknown category', () => {
    expect(categoryName('street-food')).toBe('Street Food');
  });
});
