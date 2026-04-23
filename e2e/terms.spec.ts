import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupInitiator, setupConnectedPair } from './helpers/two-party';
import type { BrowserContext } from '@playwright/test';

// Terms are off by default (VITE_REQUIRE_TERMS != "true")
// These tests verify messaging works without terms
test.describe('terms disabled (default)', () => {
  test('messages can be sent without accepting terms', async ({ browser }) => {
    const pair = await setupConnectedPair(browser);
    await pair.initiator.sendMessage('no terms needed');
    await pair.initiator.waitForOwnMessage('no terms needed');
    await pair.initiatorContext.close();
    await pair.respondentContext.close();
  });

  test('no terms warning when sending messages', async ({ browser }) => {
    const { page, context } = await setupInitiator(browser);
    await page.sendMessage('hello');
    const sys = await page.getSysMessages();
    expect(sys.every(m => !m.includes('Terms and Conditions'))).toBe(true);
    await context.close();
  });
});
