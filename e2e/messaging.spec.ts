import { test, expect } from '@playwright/test';
import { setupConnectedPair, type TwoPartySetup } from './helpers/two-party';

test.describe('message exchange', () => {
  let pair: TwoPartySetup;

  test.beforeEach(async ({ browser }) => {
    pair = await setupConnectedPair(browser);
  });

  test.afterEach(async () => {
    await pair.initiatorContext.close();
    await pair.respondentContext.close();
  });

  test('initiator sends message, appears as own', async () => {
    await pair.initiator.sendMessage('hello from initiator');
    await pair.initiator.waitForOwnMessage('hello from initiator');
    const own = await pair.initiator.getOwnMessages();
    expect(own).toContain('hello from initiator');
  });

  test('respondent receives initiator message', async () => {
    await pair.initiator.sendMessage('can you hear me');
    await pair.respondent.waitForOtherMessage('can you hear me');
    const other = await pair.respondent.getOtherMessages();
    expect(other).toContain('can you hear me');
  });

  test('respondent replies and initiator receives it', async () => {
    await pair.respondent.sendMessage('hello from respondent');
    await pair.respondent.waitForOwnMessage('hello from respondent');
    const own = await pair.respondent.getOwnMessages();
    expect(own).toContain('hello from respondent');
    await pair.initiator.waitForOtherMessage('hello from respondent');
    const other = await pair.initiator.getOtherMessages();
    expect(other).toContain('hello from respondent');
  });

  test('multiple messages maintain order', async () => {
    await pair.initiator.sendMessage('msg1');
    await pair.initiator.waitForOwnMessage('msg1');
    await pair.initiator.sendMessage('msg2');
    await pair.initiator.waitForOwnMessage('msg2');
    await pair.initiator.sendMessage('msg3');
    await pair.initiator.waitForOwnMessage('msg3');
    const own = await pair.initiator.getOwnMessages();
    expect(own).toEqual(['msg1', 'msg2', 'msg3']);

    await pair.respondent.waitForOtherMessage('msg3');
    const other = await pair.respondent.getOtherMessages();
    expect(other).toEqual(['msg1', 'msg2', 'msg3']);
  });

  test('textarea clears after sending', async () => {
    await pair.initiator.sendMessage('test message');
    const value = await pair.initiator.getTextareaValue();
    expect(value).toBe('');
  });
});
