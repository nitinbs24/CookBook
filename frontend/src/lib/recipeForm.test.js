import { describe, expect, it } from 'vitest';
import { fullRecipe } from '../test/fixtures.js';
import { emptyRecipe, fromRecipe, recipeErrors, toBody } from './recipeForm.js';

const valid = () => ({
  ...emptyRecipe(),
  title: ' Paneer Tikka ',
  dishName: 'Paneer Tikka',
  category: 'paneer',
  servings: '2',
  prepTimeMin: '10',
  cookTimeMin: '15',
  images: [{ url: 'https://img.test/a.jpg', publicId: 'recipebook/a' }],
  ingredients: [{ name: 'Paneer', quantity: '', unit: '', note: '' }],
  instructions: [{ section: '', steps: [{ text: 'Grill it.', durationMin: '', tip: '' }] }],
});

describe('emptyRecipe', () => {
  it('starts with one ingredient row and one section with one step', () => {
    const r = emptyRecipe();
    expect(r.ingredients).toHaveLength(1);
    expect(r.instructions).toHaveLength(1);
    expect(r.instructions[0].steps).toHaveLength(1);
    expect(r).toMatchObject({ foodType: 'veg', difficulty: 'easy' });
  });
});

describe('toBody', () => {
  it('trims text, turns number strings into numbers, and blank optionals into null', () => {
    const body = toBody(valid());

    expect(body).toMatchObject({ title: 'Paneer Tikka', description: null, servings: 2, prepTimeMin: 10, cookTimeMin: 15 });
    expect(body.ingredients[0]).toEqual({ name: 'Paneer', quantity: null, unit: null, note: null });
    expect(body.instructions[0]).toEqual({ section: null, steps: [{ text: 'Grill it.', durationMin: null, tip: null }] });
  });

  it('keeps decimal quantities', () => {
    const form = valid();
    form.ingredients[0].quantity = '1.5';
    expect(toBody(form).ingredients[0].quantity).toBe(1.5);
  });
});

describe('fromRecipe', () => {
  it('turns an API recipe into form strings, with null as empty', () => {
    const form = fromRecipe(fullRecipe());

    expect(form).toMatchObject({ title: 'Dhaba-style Paneer Butter Masala', servings: '4', prepTimeMin: '20' });
    expect(form.ingredients[1]).toEqual({ name: 'Salt', quantity: '', unit: '', note: 'to taste' });
    expect(form.instructions[1].section).toBe('');
    expect(form).not.toHaveProperty('id');
  });

  it('round-trips through toBody', () => {
    const recipe = fullRecipe();
    const body = toBody(fromRecipe(recipe));
    expect(body.ingredients).toEqual(recipe.ingredients);
    expect(body.instructions).toEqual(recipe.instructions);
  });
});

describe('recipeErrors', () => {
  it('accepts a valid recipe', () => {
    expect(recipeErrors(valid())).toEqual({});
  });

  it.each([
    ['title', (f) => { f.title = 'ab'; }],
    ['dishName', (f) => { f.dishName = ' '; }],
    ['category', (f) => { f.category = ''; }],
    ['images', (f) => { f.images = []; }],
    ['servings', (f) => { f.servings = '0'; }],
    ['prepTimeMin', (f) => { f.prepTimeMin = ''; }],
    ['cookTimeMin', (f) => { f.cookTimeMin = '2.5'; }],
    ['ingredients.0.name', (f) => { f.ingredients[0].name = ''; }],
    ['ingredients.0.quantity', (f) => { f.ingredients[0].quantity = '-1'; }],
    ['instructions.0.steps.0.text', (f) => { f.instructions[0].steps[0].text = 'ab'; }],
    ['instructions.0.steps.0.durationMin', (f) => { f.instructions[0].steps[0].durationMin = 'abc'; }],
  ])('flags %s', (key, breakIt) => {
    const form = valid();
    breakIt(form);
    expect(recipeErrors(form)).toHaveProperty([key]);
  });
});
