import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupInitiator, setupConnectedPair } from './helpers/two-party';
import type { BrowserContext } from '@playwright/test';

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
});
