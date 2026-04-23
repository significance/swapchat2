import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupConnectedPair, setupInitiator, type TwoPartySetup } from './helpers/two-party';

test.describe('connection flow', () => {
  test('initiator shows Connecting state on load', async ({ browser }) => {
    const { page, context } = await setupInitiator(browser);
    const status = await page.getConnectionStatus();
    expect(status).toBe('Connecting');
    await expect(page.raw.locator('.Chat-is-connecting')).toBeVisible();
    await context.close();
  });

  test('initiator generates a 194-character token', async ({ browser }) => {
    const { page, context } = await setupInitiator(browser);
    const token = await page.getToken();
    expect(token).toHaveLength(194);
    await context.close();
  });

  test('initiator shows QR code with data URL', async ({ browser }) => {
    const { page, context } = await setupInitiator(browser);
    const visible = await page.isQRCodeVisible();
    expect(visible).toBe(true);
    await context.close();
  });

  test('initiator shows chat link containing the token', async ({ browser }) => {
    const { page, context } = await setupInitiator(browser);
    const token = await page.getToken();
    const link = await page.getChatLink();
    expect(link).toContain(`?token=${token}`);
    expect(link).toContain('http://localhost:3000');
    await context.close();
  });

  test('full connection: both sides show Connected', async ({ browser }) => {
    const pair = await setupConnectedPair(browser);
    const initiatorStatus = await pair.initiator.getConnectionStatus();
    const respondentStatus = await pair.respondent.getConnectionStatus();
    expect(initiatorStatus).toBe('Connected');
    expect(respondentStatus).toBe('Connected');
    await pair.initiatorContext.close();
    await pair.respondentContext.close();
  });

  test('both sides show matching 6-char hex verification code', async ({ browser }) => {
    const pair = await setupConnectedPair(browser);
    const initiatorCode = await pair.initiator.getSecretCode();
    const respondentCode = await pair.respondent.getSecretCode();
    expect(initiatorCode).toMatch(/^[a-f0-9]{6}$/);
    expect(respondentCode).toMatch(/^[a-f0-9]{6}$/);
    expect(initiatorCode).toBe(respondentCode);
    await pair.initiatorContext.close();
    await pair.respondentContext.close();
  });

  test('Connected! system message appears on both sides', async ({ browser }) => {
    const pair = await setupConnectedPair(browser);
    await pair.initiator.waitForSysMessage('Connected!');
    await pair.respondent.waitForSysMessage('Connected!');
    await pair.initiatorContext.close();
    await pair.respondentContext.close();
  });
});
