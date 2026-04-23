import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupInitiator } from './helpers/two-party';
import type { BrowserContext } from '@playwright/test';

// These tests run against a server started with VITE_REQUIRE_TERMS=true
test.describe('terms BSOD screen', () => {
  test.skip(
    !process.env.VITE_REQUIRE_TERMS,
    'Skipped unless VITE_REQUIRE_TERMS=true'
  );

  let page: ChatPage;
  let context: BrowserContext;

  test.afterEach(async () => {
    await context?.close();
  });

  test('terms screen appears on load', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    const visible = await page.isTermsScreenVisible();
    expect(visible).toBe(true);
    await expect(page.raw.locator('.Terms-title')).toHaveText('Welcome to Swapchat : )');
    await expect(page.raw.locator('.Terms-strapline')).toHaveText('Chat like it\'s 1998!');
    await expect(page.raw.locator('.Terms-prompt')).toContainText('Y/N');
  });

  test('pressing Y dismisses terms and sets localStorage', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    expect(await page.isTermsScreenVisible()).toBe(true);
    await page.dismissTermsScreen();
    expect(await page.isTermsScreenVisible()).toBe(false);
    const stored = await page.raw.evaluate(() => localStorage.getItem('didAcceptTerms'));
    expect(stored).toBe('true');
  });

  test('terms screen does not reappear after acceptance', async ({ browser }) => {
    context = await browser.newContext();
    const rawPage = await context.newPage();
    page = new ChatPage(rawPage);
    // Set localStorage before navigating
    await rawPage.goto('/');
    await rawPage.evaluate(() => localStorage.setItem('didAcceptTerms', 'true'));
    await rawPage.goto('/');
    await rawPage.waitForTimeout(1000);
    expect(await page.isTermsScreenVisible()).toBe(false);
  });
});
