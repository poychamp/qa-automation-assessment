import { test, expect } from '@playwright/test';
import { loginAs, SAUCE } from './helpers/login';

// One test for the whole critical journey: the point at the UI layer is
// proving the flow wires together end to end. Isolated CRUD and validation
// coverage lives in the API suite instead.

test('a customer can log in, add items to the cart, and complete checkout', async ({ page }) => {
  await test.step('login lands on the product listing', async () => {
    await loginAs(page, SAUCE.username);
    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  await test.step('adding two items updates the cart badge', async () => {
    await page.getByTestId('add-to-cart-sauce-labs-backpack').click();
    await page.getByTestId('add-to-cart-sauce-labs-bike-light').click();
    await expect(page.getByTestId('shopping-cart-badge')).toHaveText('2');
  });

  await test.step('the cart shows exactly the added items with their prices', async () => {
    await page.getByTestId('shopping-cart-link').click();
    await expect(page).toHaveURL(/cart\.html/);

    const items = page.getByTestId('inventory-item');
    await expect(items).toHaveCount(2);
    await expect(page.getByTestId('inventory-item-name')).toHaveText([
      'Sauce Labs Backpack',
      'Sauce Labs Bike Light',
    ]);
    await expect(page.getByTestId('inventory-item-price')).toHaveText(['$29.99', '$9.99']);
  });

  await test.step('checkout information step accepts the buyer details', async () => {
    await page.getByTestId('checkout').click();
    await page.getByTestId('firstName').fill('Standard');
    await page.getByTestId('lastName').fill('User');
    await page.getByTestId('postalCode').fill('4000');
    await page.getByTestId('continue').click();
  });

  await test.step('the overview totals match the items in the cart', async () => {
    await expect(page).toHaveURL(/checkout-step-two\.html/);

    // Item total must equal the sum of the listed item prices, not a magic number.
    const priceTexts = await page.getByTestId('inventory-item-price').allTextContents();
    const expectedItemTotal = priceTexts
      .reduce((sum, p) => sum + Number(p.replace('$', '')), 0)
      .toFixed(2);
    await expect(page.getByTestId('subtotal-label')).toHaveText(
      `Item total: $${expectedItemTotal}`
    );
    await expect(page.getByTestId('total-label')).toContainText('Total: $');
  });

  await test.step('finishing the order shows the confirmation and empties the cart', async () => {
    await page.getByTestId('finish').click();
    await expect(page).toHaveURL(/checkout-complete\.html/);
    await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
    await expect(page.getByTestId('shopping-cart-badge')).toBeHidden();
  });
});
