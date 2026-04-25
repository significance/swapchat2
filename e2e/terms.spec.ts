import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupInitiator, setupConnectedPair } from './helpers/two-party';

// Terms are off by default (VITE_REQUIRE_TERMS != "true")
test.describe('terms disabled (default)', () => {
  test('terms screen does not appear', async ({ browser }) => {
    const { page, context } = await setupInitiator(browser);
    const visible = await page.isTermsScreenVisible();
    expect(visible).toBe(false);
    await context.close();
  });

  test('messages can be sent without terms', async ({ browser }) => {
    const pair = await setupConnectedPair(browser);
    await pair.initiator.sendMessage('no terms needed');
    await pair.initiator.waitForOwnMessage('no terms needed');
    await pair.initiatorContext.close();
    await pair.respondentContext.close();
  });
});
