import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { TEST_SIGNER_KEY as SIGNER_KEY, TEST_BATCH_ID as BATCH_ID } from './helpers/test-config';

test.describe('setup screens', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context?.close();
  });

  // --- No more signer key / batch ID screens ---

  test('chat loads directly without key/batch setup screens', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    // No setup input screens
    await expect(page.locator('.Key-input')).not.toBeVisible();
    // Chat should be visible
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 5000 });
  });

  test('welcome message prompts to use /stamps when no batch loaded', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    const sysMsg = page.locator('.Chat-message-sender-sys .Chat-message', { hasText: '/stamps' });
    await expect(sysMsg).toBeVisible({ timeout: 10_000 });
  });

  test('chat loads with localStorage stamps and shows help message', async () => {
    await page.goto('/');
    await page.evaluate((keys) => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.setItem('swapchat_signerKey', keys.signer);
      localStorage.setItem('swapchat_batchId', keys.batch);
    }, { signer: SIGNER_KEY, batch: BATCH_ID });
    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 5000 });
    const sysMsg = page.locator('.Chat-message-sender-sys .Chat-message', { hasText: '/help' });
    await expect(sysMsg).toBeVisible({ timeout: 10_000 });
  });

  test('QR code appears when stamps are preloaded', async () => {
    await page.goto('/');
    await page.evaluate((keys) => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.setItem('swapchat_signerKey', keys.signer);
      localStorage.setItem('swapchat_batchId', keys.batch);
    }, { signer: SIGNER_KEY, batch: BATCH_ID });
    await page.goto('/');
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 30_000 });
    const qrImg = page.locator('.Chat-code-qr img');
    await expect(qrImg).toHaveAttribute('src', /data:image\/png/, { timeout: 30_000 });
  });
});
