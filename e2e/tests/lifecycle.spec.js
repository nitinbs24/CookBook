import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { logIn, logOut, PASSWORD } from './helpers.js';

const PHOTO = fileURLToPath(new URL('../fixtures/dish.png', import.meta.url));
const cook = { name: 'E2E Cook', email: `e2e-${Date.now()}@example.com` };
const TITLE = 'E2E Smoky Paneer Tikka';
let recipeUrl;

// One recipe's whole life, in order: each step builds on the one before.
test.describe.serial('recipe lifecycle', () => {
  test('a new user signs up and adds a recipe with a photo', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill(cook.name);
    await page.getByLabel('Email').fill(cook.email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.locator('header summary')).toContainText(cook.name);

    await page.getByRole('link', { name: 'Add recipe' }).click();
    await page.getByLabel('Add photo').setInputFiles(PHOTO);
    await expect(page.getByRole('img', { name: 'Photo 1 (cover)' })).toBeVisible();
    await page.getByLabel('Title', { exact: true }).fill(TITLE);
    await page.getByLabel('Dish name').fill('Paneer Tikka');
    await page.getByLabel('Category').selectOption('paneer');
    await page.getByLabel('Servings').fill('3');
    await page.getByLabel('Prep time (min)').fill('30');
    await page.getByLabel('Cook time (min)').fill('15');
    await page.getByLabel('Ingredient 1 name').fill('Paneer');
    await page.getByLabel('Ingredient 1 quantity').fill('250');
    await page.getByLabel('Ingredient 1 unit').fill('g');
    await page.getByLabel('Section 1, step 1', { exact: true }).fill('Marinate the paneer, then grill until charred.');
    await page.getByRole('button', { name: 'Save recipe' }).click();

    await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible();
    await expect(page.getByText('250 g')).toBeVisible();
    recipeUrl = new URL(page.url()).pathname;

    await page.locator('header summary').click();
    await page.getByRole('link', { name: 'My recipes' }).click();
    await expect(page.getByRole('link', { name: TITLE })).toBeVisible();
  });

  test('the author edits the title', async ({ page }) => {
    await logIn(page, cook.email);
    await page.goto(recipeUrl);
    await page.getByRole('link', { name: 'Edit' }).click();
    await page.getByLabel('Title', { exact: true }).fill(`${TITLE} v2`);
    await page.getByRole('button', { name: 'Save recipe' }).click();

    await expect(page.getByRole('heading', { level: 1, name: `${TITLE} v2` })).toBeVisible();
  });

  test('another user likes it (Want to try) and reviews it', async ({ page }) => {
    await logIn(page, 'asha@recipebook.test');
    await page.goto(recipeUrl);
    await page.getByRole('button', { name: 'Like (0 likes)' }).click();
    await expect(page.getByRole('button', { name: 'Unlike (1 likes)' })).toBeVisible();

    await page.getByRole('radio', { name: '5 stars' }).check({ force: true });
    await page.getByLabel('Comment (optional)').fill('Charred and perfect.');
    await page.getByRole('button', { name: 'Post review' }).click();
    await expect(page.getByText('Charred and perfect.')).toBeVisible();
    await expect(page.getByText('You reviewed this recipe.')).toBeVisible();

    await page.locator('header summary').click();
    await page.getByRole('link', { name: 'Want to try' }).click();
    await expect(page.getByRole('link', { name: `${TITLE} v2` })).toBeVisible();
    await logOut(page);
  });

  test('an admin deletes it, and it is gone everywhere', async ({ page }) => {
    await logIn(page, 'admin@recipebook.test');
    await page.locator('header summary').click();
    await page.getByRole('link', { name: 'Admin' }).click();
    await page.getByRole('searchbox', { name: 'Search recipes by title' }).fill('Smoky Paneer Tikka');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('button', { name: `Delete ${TITLE} v2` }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Recipe deleted')).toBeVisible();

    await page.goto(recipeUrl);
    await expect(page.getByRole('heading', { name: 'Recipe not found' })).toBeVisible();
  });
});
