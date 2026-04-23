import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupInitiator, setupConnectedPair } from './helpers/two-party';
import type { BrowserContext } from '@playwright/test';

test.describe('terms acceptance', () => {
  let page: ChatPage;
  let context: BrowserContext;

  test.afterEach(async () => {
    await context?.close();
  });

  test('sending message without accepting terms shows warning', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('hello');
    await page.waitForSysMessage('You must accept the Terms and Conditions');
  });

  test('/a accepts terms and shows confirmation', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/a');
    await page.waitForSysMessage('Terms accepted');
  });

  test('/terms accept also works', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/terms accept');
    await page.waitForSysMessage('Terms accepted');
  });

  test('terms acceptance persists in localStorage', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.acceptTerms();
    await page.waitForSysMessage('Terms accepted');
    const stored = await page.raw.evaluate(() => localStorage.getItem('didAcceptTerms'));
    expect(stored).toBe('true');
  });
});
