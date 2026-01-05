import { expect, test } from '@playwright/test';

test('jsnation.com tickets', async ({ page }) => {
  const baseURL = new URL('https://jsnation.com/');
  await page.goto(baseURL.href, { waitUntil: 'domcontentloaded' });
  await page.pause();

  const ticketsPrices = page.locator('#tickets > div > div.prices');
  await expect(ticketsPrices).toBeVisible({ timeout: 60_000 });
  await expect.soft(ticketsPrices).toHaveScreenshot();
});
