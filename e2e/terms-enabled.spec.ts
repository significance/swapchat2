import { test, expect } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';
import { TEST_SIGNER_KEY, TEST_BATCH_ID } from './helpers/test-config';

// These tests navigate directly without using setupInitiator (which auto-dismisses overlays)
test.describe('terms BSOD screen', () => {
  test.skip(
    !process.env.VITE_REQUIRE_TERMS,
    'Skipped unless VITE_REQUIRE_TERMS=true'
  );

  let context: BrowserContext;

  test.afterEach(async () => {
    await context?.close();
  });

  test('terms screen appears on load', async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page.locator('.Terms-screen')).toBeVisible();
    await expect(page.locator('.Terms-title')).toHaveText('Welcome to Swapchat : )');
    await expect(page.locator('.Terms-strapline')).toHaveText('Chat like it\'s 1998!');
    await expect(page.locator('.Terms-prompt')).toContainText('Y/N');
  });

  test('pressing Y dismisses terms and sets localStorage', async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page.locator('.Terms-screen')).toBeVisible();
    // Focus the terms screen and press Y
    await page.locator('.Terms-screen').focus();
    await page.keyboard.press('y');
    await page.waitForTimeout(500);
    const stored = await page.evaluate(() => localStorage.getItem('didAcceptTerms'));
    expect(stored).toBe('true');
  });

  test('terms screen does not reappear after acceptance', async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    // Pre-set acceptance and all credentials to skip all screens
    await page.goto('/');
    await page.evaluate(({ sk, bi }) => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.setItem('swapchat_signerKey', sk);
      localStorage.setItem('swapchat_batchId', bi);
    }, { sk: TEST_SIGNER_KEY, bi: TEST_BATCH_ID });
    await page.goto('/');
    await page.waitForTimeout(1000);
    // Chat should be visible, no terms screen
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 5000 });
  });

  test('pressing R shows terms reader', async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page.locator('.Terms-screen')).toBeVisible();
    await page.locator('.Terms-screen').press('r');
    await page.waitForTimeout(300);
    await expect(page.locator('.Terms-reader-text')).toBeVisible();
    await expect(page.locator('.Terms-reader-nav')).toContainText('Page 1 of');
  });

  test('terms reader pages through and Y accepts on last page', async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.locator('.Terms-screen').press('r');
    await page.waitForTimeout(300);
    // Navigate to last page
    await page.locator('.Terms-screen').press(' ');
    await page.locator('.Terms-screen').press(' ');
    await page.locator('.Terms-screen').press(' ');
    await page.waitForTimeout(300);
    await expect(page.locator('.Terms-reader-nav')).toContainText('Page 4 of 4');
    await expect(page.locator('.Terms-prompt')).toContainText('Y/N');
    // Accept
    await page.locator('.Terms-screen').press('y');
    await page.waitForTimeout(500);
    const stored = await page.evaluate(() => localStorage.getItem('didAcceptTerms'));
    expect(stored).toBe('true');
  });

  test('ESC returns from reader to welcome screen', async ({ browser }) => {
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForTimeout(1000);
    await page.locator('.Terms-screen').press('r');
    await page.waitForTimeout(300);
    await expect(page.locator('.Terms-reader-text')).toBeVisible();
    await page.locator('.Terms-screen').press('Escape');
    await page.waitForTimeout(300);
    await expect(page.locator('.Terms-title')).toHaveText('Welcome to Swapchat : )');
  });
});
