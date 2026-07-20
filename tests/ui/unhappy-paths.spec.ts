import { test, expect } from '@playwright/test';
import { loginAs, SAUCE } from './helpers/login';

test.describe('the store rejects invalid input with clear errors', () => {
  test('a locked out user cannot log in and sees the lockout message', async ({ page }) => {
    await loginAs(page, 'locked_out_user');

    await expect(page.getByTestId('error')).toHaveText(
      'Epic sadface: Sorry, this user has been locked out.'
    );
    // Still on the login page, not partially let through.
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('checkout without a first name shows a validation error', async ({ page }) => {
    await loginAs(page, SAUCE.username);
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('shopping-cart-link').click();
    await page.getByTestId('checkout').click();

    await page.getByTestId('lastName').fill('User');
    await page.getByTestId('postalCode').fill('4000');
    await page.getByTestId('continue').click();

    await expect(page.getByTestId('error')).toHaveText('Error: First Name is required');
    // The order must not have advanced past the information step.
    await expect(page).toHaveURL(/checkout-step-one\.html/);
  });
});
