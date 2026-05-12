import { type Browser, type BrowserContext } from '@playwright/test';
import { ChatPage } from './chat-page';

export interface TwoPartySetup {
  initiator: ChatPage;
  respondent: ChatPage;
  initiatorContext: BrowserContext;
  respondentContext: BrowserContext;
}

export async function setupConnectedPair(browser: Browser): Promise<TwoPartySetup> {
  const initiatorContext = await browser.newContext();
  const respondentContext = await browser.newContext();

  const initiator = new ChatPage(await initiatorContext.newPage());
  const respondent = new ChatPage(await respondentContext.newPage());

  await initiator.goInitiator();

  const token = await initiator.getToken();

  await respondent.goRespondent(token);

  await Promise.all([
    initiator.waitForConnected(),
    respondent.waitForConnected(),
  ]);

  return { initiator, respondent, initiatorContext, respondentContext };
}

export async function setupInitiator(browser: Browser): Promise<{ page: ChatPage; context: BrowserContext }> {
  const context = await browser.newContext();
  const page = new ChatPage(await context.newPage());
  await page.goInitiator();
  return { page, context };
}
