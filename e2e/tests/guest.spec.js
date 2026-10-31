import { expect, test } from '@playwright/test';

test('a guest browses by category, opens a recipe, and is asked to sign up to like it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue as guest' }).click();

  await expect(page.getByRole('heading', { name: 'Trending this week' })).toBeVisible();
  await page.getByRole('link', { name: /^Paneer \d+ recipes?$/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Paneer' })).toBeVisible();

  await page.locator('article h3 a').first().click();
  await expect(page.getByRole('heading', { name: 'Ingredients' })).toBeVisible();
  await page.getByRole('button', { name: /^Like \(/ }).click();
  await expect(page.getByRole('dialog', { name: 'Sign up to like and review recipes' })).toBeVisible();
});

test('the veg toggle hides non-veg categories and survives a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Continue as guest' }).click();
  await expect(page.getByRole('link', { name: /^Chicken \d+ recipes?$/ })).toBeVisible();

  await page.locator('header').getByText('Veg', { exact: true }).click();
  await expect(page.getByRole('link', { name: /^Chicken \d+ recipes?$/ })).toHaveCount(0);
  await page.reload();

  await expect(page.getByRole('radio', { name: 'Veg', exact: true })).toBeChecked();
  await expect(page.getByRole('link', { name: /^Chicken \d+ recipes?$/ })).toHaveCount(0);
});
