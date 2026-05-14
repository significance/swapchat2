import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupInitiator, setupConnectedPair } from './helpers/two-party';
import type { BrowserContext } from '@playwright/test';
import { TEST_SIGNER_KEY, TEST_BATCH_ID } from './helpers/test-config';

// Minimal valid Book of Stamps file for testing
const BOOK_OF_STAMPS = [
  '-----BEGIN BOOK OF STAMPS-----',
  'Version: 1',
  `Batch-Id: ${TEST_BATCH_ID || 'a'.repeat(64)}`,
  `Owner: ${'b'.repeat(40)}`,
  'Depth: 20',
  'Bucket-Depth: 16',
  'Amount: 1000000000',
  'Usage: 0/1048576',
  '',
  // base64 of 32 bytes (the test signer key or a dummy)
  TEST_SIGNER_KEY
    ? btoa(String.fromCharCode(...TEST_SIGNER_KEY.match(/.{2}/g)!.map(h => parseInt(h, 16))))
    : 'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVoxMjM0NTY=',
  '-----END BOOK OF STAMPS-----',
  '',
].join('\n');

test.describe('slash commands', () => {
  let page: ChatPage;
  let context: BrowserContext;

  test.afterEach(async () => {
    await context?.close();
  });

  test('/help shows help menu', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/help');
    await page.waitForSysMessage('Swapchat is brought to you by');
    const sys = await page.getSysMessages();
    expect(sys.some(m => m.includes('/clear'))).toBe(true);
  });

  test('/clear removes all messages', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/help');
    await page.waitForSysMessage('Swapchat is brought to you by');

    const before = await page.getSysMessages();
    expect(before.length).toBeGreaterThan(0);

    await page.sendMessage('/clear');
    await page.raw.waitForTimeout(500);
    const own = await page.getOwnMessages();
    const sys = await page.getSysMessages();
    const other = await page.getOtherMessages();
    expect(own.length + sys.length + other.length).toBe(0);
  });

  test('/copy code shows confirmation (initiator)', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.getToken();
    await page.sendMessage('/copy code');
    await page.waitForSysMessage('Code copied to clipboard.');
  });

  test('/copy link shows confirmation (initiator)', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.getToken();
    await page.sendMessage('/copy link');
    await page.waitForSysMessage('Link copied to clipboard.');
  });

  test('/help connect shows connection help', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/help connect');
    await page.waitForSysMessage('Scan the QR code');
  });

  test('/links shows links submenu', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/links');
    await page.waitForSysMessage('Swarm');
    const sys = await page.getSysMessages();
    expect(sys.some(m => m.includes('1UP'))).toBe(true);
    expect(sys.some(m => m.includes('source'))).toBe(true);
  });

  test('unknown slash command does not appear as own message', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/nonexistent');
    await page.raw.waitForTimeout(500);
    const own = await page.getOwnMessages();
    expect(own).not.toContain('/nonexistent');
  });

  test('/qr shows fullscreen QR overlay and dismisses on keypress', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.getToken(); // wait for token to exist
    await page.sendMessage('/qr');
    await expect(page.raw.locator('.QR-fullscreen')).toBeVisible({ timeout: 5_000 });
    await expect(page.raw.locator('.QR-fullscreen img')).toBeVisible();
    await page.raw.locator('.QR-fullscreen').press('Escape');
    await expect(page.raw.locator('.QR-fullscreen')).not.toBeVisible({ timeout: 2_000 });
  });

  test('/help includes /stamps and /eject', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/help');
    await page.waitForSysMessage('Swapchat is brought to you by');
    const sys = await page.getSysMessages();
    expect(sys.some(m => m.includes('/stamps'))).toBe(true);
    expect(sys.some(m => m.includes('/eject'))).toBe(true);
  });

  test('/code without stamps shows load message', async ({ browser }) => {
    context = await browser.newContext();
    const rawPage = await context.newPage();
    await rawPage.goto('/');
    await rawPage.evaluate(() => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await rawPage.goto('/');
    page = new ChatPage(rawPage);
    await rawPage.waitForTimeout(2000);
    await page.sendMessage('/code');
    await page.waitForSysMessage('Load a book of stamps first');
  });

  test('/link without stamps shows load message', async ({ browser }) => {
    context = await browser.newContext();
    const rawPage = await context.newPage();
    await rawPage.goto('/');
    await rawPage.evaluate(() => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await rawPage.goto('/');
    page = new ChatPage(rawPage);
    await rawPage.waitForTimeout(2000);
    await page.sendMessage('/link');
    await page.waitForSysMessage('Load a book of stamps first');
  });

  test('/stamps opens file chooser', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    const fileChooserPromise = page.raw.waitForEvent('filechooser', { timeout: 5_000 });
    await page.sendMessage('/stamps');
    const fileChooser = await fileChooserPromise;
    expect(fileChooser).toBeDefined();
  });

  test('/eject without stamps shows error', async ({ browser }) => {
    context = await browser.newContext();
    const rawPage = await context.newPage();
    await rawPage.goto('/');
    await rawPage.evaluate(() => {
      localStorage.setItem('didAcceptTerms', 'true');
      localStorage.removeItem('swapchat_signerKey');
      localStorage.removeItem('swapchat_batchId');
    });
    await rawPage.goto('/');
    page = new ChatPage(rawPage);
    await rawPage.waitForTimeout(2000);
    await page.sendMessage('/eject');
    await page.waitForSysMessage('No book of stamps loaded');
  });

  test('/eject with stamps triggers download', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    const downloadPromise = page.raw.waitForEvent('download', { timeout: 10_000 });
    await page.sendMessage('/eject');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^book-of-stamps-.*\.txt$/);
    await page.waitForSysMessage('Book of stamps ejected');
  });
});
