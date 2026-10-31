import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '../api/auth.js';
import { ApiError } from '../api/client.js';
import * as recipesApi from '../api/recipes.js';
import { fullRecipe, loginAs } from '../test/fixtures.js';
import { renderApp } from '../test/render.jsx';
import RecipeForm from './RecipeForm.jsx';

vi.mock('../api/auth.js');
vi.mock('../api/recipes.js');
beforeEach(() => {
  vi.resetAllMocks();
  loginAs(authApi, { id: 'u1', name: 'Asha Rao', email: 'a@x.co', role: 'user', createdAt: '' });
  recipesApi.uploadImage.mockResolvedValue({ url: 'https://img.test/up.jpg', publicId: 'recipebook/up' });
});

const renderNew = () =>
  renderApp(<RecipeForm />, { route: '/recipes/new', path: '/recipes/new', extraRoutes: { '/recipes/:id': 'recipe page' } });
const renderEdit = () =>
  renderApp(<RecipeForm />, { route: '/recipes/r1/edit', path: '/recipes/:id/edit', extraRoutes: { '/recipes/:id': 'recipe page' } });
const png = (bytes = 100, type = 'image/png', name = 'dish.png') => new File([new Uint8Array(bytes)], name, { type });

async function fillValid(user) {
  await user.upload(screen.getByLabelText('Add photo'), png());
  await screen.findByRole('img', { name: 'Photo 1 (cover)' });
  await user.type(screen.getByLabelText('Title'), 'Paneer Tikka');
  await user.type(screen.getByLabelText('Dish name'), 'Paneer Tikka');
  await user.selectOptions(screen.getByLabelText('Category'), 'paneer');
  await user.type(screen.getByLabelText('Servings'), '2');
  await user.type(screen.getByLabelText('Prep time (min)'), '10');
  await user.type(screen.getByLabelText('Cook time (min)'), '15');
  await user.type(screen.getByLabelText('Ingredient 1 name'), 'Paneer');
  await user.type(screen.getByLabelText('Section 1, step 1'), 'Grill until charred.');
}

describe('Recipe form: new', () => {
  it('adds and removes ingredient rows, steps, and sections', async () => {
    const user = userEvent.setup();
    renderNew();
    const removeFirst = await screen.findByRole('button', { name: 'Remove ingredient 1' });
    expect(removeFirst).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add ingredient' }));
    expect(screen.getByLabelText('Ingredient 2 name')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove ingredient 2' }));
    expect(screen.queryByLabelText('Ingredient 2 name')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add step to section 1' }));
    expect(screen.getByLabelText('Section 1, step 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add section' }));
    expect(screen.getByLabelText('Section 2, step 1')).toBeInTheDocument();
  });

  it('shows errors, focuses the first one, and does not save an incomplete recipe', async () => {
    const user = userEvent.setup();
    renderNew();

    await user.click(await screen.findByRole('button', { name: 'Save recipe' }));

    expect(screen.getByText(/add at least one photo/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(document.activeElement).toHaveAttribute('aria-invalid', 'true');
    expect(recipesApi.createRecipe).not.toHaveBeenCalled();
  });

  it('uploads a picked photo and marks the first as the cover', async () => {
    const user = userEvent.setup();
    renderNew();

    await user.upload(await screen.findByLabelText('Add photo'), png());

    expect(await screen.findByRole('img', { name: 'Photo 1 (cover)' })).toHaveAttribute('src', 'https://img.test/up.jpg');
    expect(recipesApi.uploadImage).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['a file over 5 MB', png(5 * 1024 * 1024 + 1), /must be 5 MB or smaller/],
    ['a GIF', png(100, 'image/gif', 'a.gif'), /must be JPEG, PNG, or WebP/],
  ])('rejects %s before uploading', async (_label, file, message) => {
    const user = userEvent.setup({ applyAccept: false });
    renderNew();

    await user.upload(await screen.findByLabelText('Add photo'), file);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(recipesApi.uploadImage).not.toHaveBeenCalled();
  });

  it('saves a complete recipe and opens it', async () => {
    const user = userEvent.setup();
    recipesApi.createRecipe.mockResolvedValue(fullRecipe({ id: 'new1' }));
    renderNew();
    await screen.findByLabelText('Title');

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Save recipe' }));

    expect(await screen.findByText('recipe page')).toBeInTheDocument();
    expect(recipesApi.createRecipe).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Paneer Tikka', category: 'paneer', servings: 2, foodType: 'veg',
      images: [{ url: 'https://img.test/up.jpg', publicId: 'recipebook/up' }],
      ingredients: [{ name: 'Paneer', quantity: null, unit: null, note: null }],
    }));
  });

  it('shows a server validation error under the field it names', async () => {
    const user = userEvent.setup();
    recipesApi.createRecipe.mockRejectedValue(new ApiError(400, 'VALIDATION_ERROR', 'category: unknown category "paneer"'));
    renderNew();
    await screen.findByLabelText('Title');

    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Save recipe' }));

    expect(await screen.findByText('unknown category "paneer"')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Recipe form: cancel', () => {
  it('goes home from a new recipe, even with no history', async () => {
    const user = userEvent.setup();
    renderApp(<RecipeForm />, { route: '/recipes/new', path: '/recipes/new', extraRoutes: { '/home': 'home page' } });

    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('home page')).toBeInTheDocument();
  });
});

describe('Recipe form: edit', () => {
  it('prefills the recipe and saves changes with PUT', async () => {
    const user = userEvent.setup();
    recipesApi.getRecipe.mockResolvedValue(fullRecipe());
    recipesApi.updateRecipe.mockResolvedValue(fullRecipe({ title: 'Better Paneer' }));
    renderEdit();

    const title = await screen.findByDisplayValue('Dhaba-style Paneer Butter Masala');
    expect(screen.getAllByRole('img', { name: /Photo \d/ })).toHaveLength(2);
    await user.clear(title);
    await user.type(title, 'Better Paneer');
    await user.click(screen.getByRole('button', { name: 'Save recipe' }));

    expect(await screen.findByText('recipe page')).toBeInTheDocument();
    expect(recipesApi.updateRecipe).toHaveBeenCalledWith('r1', expect.objectContaining({ title: 'Better Paneer', servings: 4 }));
  });

  it('removes a photo, and the next one becomes the cover', async () => {
    const user = userEvent.setup();
    recipesApi.getRecipe.mockResolvedValue(fullRecipe());
    renderEdit();
    await screen.findByDisplayValue('Dhaba-style Paneer Butter Masala');

    await user.click(screen.getByRole('button', { name: 'Remove photo 1' }));

    expect(screen.getByRole('img', { name: 'Photo 1 (cover)' })).toHaveAttribute('src', 'https://img.test/pbm2.jpg');
  });

  it('shows a placeholder while the recipe loads', async () => {
    recipesApi.getRecipe.mockReturnValue(new Promise(() => {}));
    renderEdit();

    expect(await screen.findByRole('status', { name: 'Loading recipe' })).toBeInTheDocument();
  });

  it('refuses to edit someone else’s recipe', async () => {
    recipesApi.getRecipe.mockResolvedValue(fullRecipe({ author: { id: 'someone-else', name: 'Ravi' } }));
    renderEdit();

    expect(await screen.findByText(/only edit your own recipes/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save recipe' })).not.toBeInTheDocument();
  });

  it('keeps photo previews inside the photos section', async () => {
    recipesApi.getRecipe.mockResolvedValue(fullRecipe());
    renderEdit();
    const photos = await screen.findByRole('region', { name: 'Photos' });

    expect(within(photos).getAllByRole('img')).toHaveLength(2);
    await waitFor(() => expect(recipesApi.getRecipe).toHaveBeenCalledWith('r1'));
  });
});
