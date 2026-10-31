import { expect } from '@playwright/test';

export const PASSWORD = 'password123';

export async function logIn(page, email, password = PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/home$/);
}

export async function logOut(page) {
  await page.locator('header details summary').click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
}
