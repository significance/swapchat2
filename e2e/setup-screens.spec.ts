import { test, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { TEST_SIGNER_KEY as SIGNER_KEY, TEST_BATCH_ID as BATCH_ID } from './helpers/test-config';
const SHORT_KEY = 'abcd1234';

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

  // --- Signer Key Screen ---

  test('key screen shows when no signerKey in env or localStorage', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    // If env var provides signerKey, the screen won't show — skip
    const keyScreen = page.locator('.Terms-screen .Key-input[type="password"]');
    if (!(await keyScreen.isVisible())) {
      test.skip(true, 'Signer key provided via env var — screen skipped');
    }
    await expect(page.locator('.Terms-title')).toHaveText('Stamp Configuration');
    await expect(page.locator('.Terms-strapline')).toContainText('private key');
  });

  test('key screen input has focus', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await expect(keyInput).toBeFocused();
  });

  test('key screen shows character count', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await expect(page.locator('.Terms-hint')).toContainText('0/64');
    await keyInput.fill(SHORT_KEY);
    await expect(page.locator('.Terms-hint')).toContainText(`${SHORT_KEY.length}/64`);
  });

  test('key screen rejects short key with error', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await keyInput.fill(SHORT_KEY);
    await keyInput.press('Enter');
    await expect(page.locator('.Key-error')).toHaveText('Key must be 64 hex characters');
    // Screen should still be visible
    await expect(keyInput).toBeVisible();
  });

  test('key screen accepts 64-char key, saves to localStorage, advances', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await keyInput.fill(SIGNER_KEY);
    await keyInput.press('Enter');
    // Key screen should disappear
    await expect(keyInput).not.toBeVisible({ timeout: 2000 });
    // Should have saved to localStorage
    const saved = await page.evaluate(() => localStorage.getItem('swapchat_signerKey'));
    expect(saved).toBe(SIGNER_KEY);
  });

  // --- Batch ID Screen ---

  test('batch screen shows after key screen', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await keyInput.fill(SIGNER_KEY);
    await keyInput.press('Enter');
    // Batch screen should appear
    const batchInput = page.locator('.Key-input[type="text"]');
    await expect(batchInput).toBeVisible({ timeout: 2000 });
    await expect(page.locator('.Terms-strapline')).toContainText('postage batch ID');
  });

  test('batch screen input has focus', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await keyInput.fill(SIGNER_KEY);
    await keyInput.press('Enter');
    const batchInput = page.locator('.Key-input[type="text"]');
    await expect(batchInput).toBeVisible({ timeout: 2000 });
    await expect(batchInput).toBeFocused();
  });

  test('batch screen rejects short ID with error', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await keyInput.fill(SIGNER_KEY);
    await keyInput.press('Enter');
    const batchInput = page.locator('.Key-input[type="text"]');
    await expect(batchInput).toBeVisible({ timeout: 2000 });
    await batchInput.fill(SHORT_KEY);
    await batchInput.press('Enter');
    await expect(page.locator('.Key-error')).toHaveText('Batch ID must be 64 hex characters');
  });

  test('batch screen accepts 64-char ID, saves to localStorage, shows chat', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await keyInput.fill(SIGNER_KEY);
    await keyInput.press('Enter');
    const batchInput = page.locator('.Key-input[type="text"]');
    await expect(batchInput).toBeVisible({ timeout: 2000 });
    await batchInput.fill(BATCH_ID);
    await batchInput.press('Enter');
    // Batch screen should disappear, chat should be visible
    await expect(batchInput).not.toBeVisible({ timeout: 2000 });
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 5000 });
    // Should have saved to localStorage
    const saved = await page.evaluate(() => localStorage.getItem('swapchat_batchId'));
    expect(saved).toBe(BATCH_ID);
  });

  // --- localStorage persistence ---

  test('screens are skipped when localStorage has both values', async () => {
    await page.goto('/');
    await page.evaluate((keys) => {
      localStorage.setItem('swapchat_signerKey', keys.signer);
      localStorage.setItem('swapchat_batchId', keys.batch);
    }, { signer: SIGNER_KEY, batch: BATCH_ID });
    await page.goto('/');
    await page.waitForTimeout(1000);
    // Neither setup screen should be visible
    await expect(page.locator('.Key-input')).not.toBeVisible();
    // Chat should be visible
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 5000 });
  });

  test('key screen skipped but batch screen shows when only signerKey in localStorage', async () => {
    await page.goto('/');
    await page.evaluate((key) => {
      localStorage.setItem('swapchat_signerKey', key);
      localStorage.removeItem('swapchat_batchId');
    }, SIGNER_KEY);
    await page.goto('/');
    await page.waitForTimeout(1000);
    // If env provides stamp, batch screen won't show
    const batchInput = page.locator('.Key-input[type="text"]');
    if (!(await batchInput.isVisible())) {
      test.skip(true, 'Stamp provided via env var');
    }
    await expect(page.locator('.Terms-strapline')).toContainText('postage batch ID');
  });

  test('key screen shows when only batchId in localStorage', async () => {
    await page.goto('/');
    await page.evaluate((batch) => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.setItem('swapchat_batchId', batch);
    }, BATCH_ID);
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Signer key provided via env var');
    }
    await expect(page.locator('.Terms-strapline')).toContainText('private key');
  });

  // --- Full flow: key → batch → chat ---

  test('complete flow: key screen → batch screen → chat visible', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
      localStorage.removeItem('swapchat_stampState');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Credentials provided via env var');
    }
    // Step 1: Enter signer key
    await keyInput.fill(SIGNER_KEY);
    await keyInput.press('Enter');

    // Step 2: Enter batch ID
    const batchInput = page.locator('.Key-input[type="text"]');
    await expect(batchInput).toBeVisible({ timeout: 2000 });
    await batchInput.fill(BATCH_ID);
    await batchInput.press('Enter');

    // Step 3: Chat is visible
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.Chat-controls textarea')).toBeVisible();

    // Both values in localStorage
    const signerSaved = await page.evaluate(() => localStorage.getItem('swapchat_signerKey'));
    const batchSaved = await page.evaluate(() => localStorage.getItem('swapchat_batchId'));
    expect(signerSaved).toBe(SIGNER_KEY);
    expect(batchSaved).toBe(BATCH_ID);
  });

  test('QR code appears after completing setup flow', async () => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
      localStorage.removeItem('swapchat_stampState');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    const keyInput = page.locator('.Key-input[type="password"]');
    if (!(await keyInput.isVisible())) {
      test.skip(true, 'Credentials provided via env var');
    }
    await keyInput.fill(SIGNER_KEY);
    await keyInput.press('Enter');

    const batchInput = page.locator('.Key-input[type="text"]');
    await expect(batchInput).toBeVisible({ timeout: 2000 });
    await batchInput.fill(BATCH_ID);
    await batchInput.press('Enter');

    // Wait for validation and chat to load
    await expect(page.locator('.Chat-welcome')).toBeVisible({ timeout: 30_000 });
    // QR code generates after initiate() completes
    const qrImg = page.locator('.Chat-code-qr img');
    await expect(qrImg).toHaveAttribute('src', /data:image\/png/, { timeout: 30_000 });
  });
});
