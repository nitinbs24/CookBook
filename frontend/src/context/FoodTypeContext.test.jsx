import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FoodTypeProvider, useFoodType } from './FoodTypeContext.jsx';

const setup = () => renderHook(() => useFoodType(), { wrapper: FoodTypeProvider });

describe('FoodTypeContext', () => {
  it('defaults to both, which sends no foodType to the API', () => {
    const { result } = setup();

    expect(result.current.foodType).toBe('both');
    expect(result.current.apiFoodType).toBeUndefined();
  });

  it('remembers the choice in localStorage and maps it for the API', () => {
    const { result } = setup();

    act(() => result.current.setFoodType('veg'));

    expect(result.current.apiFoodType).toBe('veg');
    expect(localStorage.getItem('rb_foodType')).toBe('veg');
  });

  it('restores a saved choice and ignores junk values', () => {
    localStorage.setItem('rb_foodType', 'nonveg');
    expect(setup().result.current.foodType).toBe('nonveg');

    localStorage.setItem('rb_foodType', 'vegan');
    expect(setup().result.current.foodType).toBe('both');
  });
});
