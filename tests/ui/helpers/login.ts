import { Page } from '@playwright/test';

// Published demo credentials printed on the saucedemo login page itself,
// overridable via env. Real projects inject these from CI secret storage.
export const SAUCE = {
  username: process.env.SAUCE_USER ?? 'standard_user',
  password: process.env.SAUCE_PASS ?? 'secret_sauce',
};

export async function loginAs(page: Page, username: string, password = SAUCE.password) {
  await page.goto('/');
  await page.getByTestId('username').fill(username);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('login-button').click();
}
