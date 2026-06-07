import { type Page, expect } from '@playwright/test';
import { TEST_SIGNER_KEY, TEST_BATCH_ID, TEST_BOOK_TEXT } from './test-config';

export class ChatPage {
  constructor(private page: Page) {}

  async goInitiator() {
    await this.page.goto('/');
    await this.dismissOverlays();
  }

  async goRespondent(token: string) {
    await this.page.goto(`/?token=${token}`);
    await this.dismissOverlays();
  }

  async dismissOverlays() {
    // Set all required localStorage values to skip setup screens, then reload
    await this.page.evaluate(({ sk, bi, bt }) => {
      localStorage.setItem('didAcceptTerms', 'true');
      if (!localStorage.getItem('swapchat_signerKey')) localStorage.setItem('swapchat_signerKey', sk);
      if (!localStorage.getItem('swapchat_batchId')) localStorage.setItem('swapchat_batchId', bi);
      if (!localStorage.getItem('swapchat_bookOfStamps')) localStorage.setItem('swapchat_bookOfStamps', bt);
    }, { sk: TEST_SIGNER_KEY, bi: TEST_BATCH_ID, bt: TEST_BOOK_TEXT });
    // Only reload if a setup screen is showing
    const setupScreen = this.page.locator('.Terms-screen');
    if (await setupScreen.isVisible().catch(() => false)) {
      await this.page.reload();
      await this.page.waitForTimeout(500);
    }
  }

  async getToken(): Promise<string> {
    const input = this.page.locator('.Chat-code-code input.Chat-code-copyToClipboard');
    await expect(input).not.toHaveValue('', { timeout: 30_000 });
    return await input.inputValue();
  }

  async getChatLink(): Promise<string> {
    const input = this.page.locator('.Chat-code-link input.Chat-code-copyToClipboard');
    await expect(input).not.toHaveValue('', { timeout: 30_000 });
    return await input.inputValue();
  }

  async waitForConnected() {
    await expect(this.page.locator('.Chat-header-connect-feedback'))
      .toHaveText('Connected', { timeout: 90_000 });
  }

  async getSecretCode(): Promise<string> {
    return await this.page.locator('.Chat-code-verification').first().textContent() ?? '';
  }

  async sendMessage(text: string) {
    const textarea = this.page.locator('.Chat-controls textarea');
    await textarea.click();
    await textarea.pressSequentially(text, { delay: 20 });
    await expect(textarea).toHaveValue(text);
    await textarea.press('Enter');
    // Wait for message to be processed and textarea to clear
    await expect(textarea).toHaveValue('', { timeout: 5_000 });
  }

  async clickSend(text: string) {
    const textarea = this.page.locator('.Chat-controls textarea');
    await textarea.fill(text);
    await this.page.locator('.Chat-controls button').click();
  }

  async isTermsScreenVisible(): Promise<boolean> {
    const screen = this.page.locator('.Terms-screen');
    if (!(await screen.isVisible().catch(() => false))) return false;
    const title = await this.page.locator('.Terms-title').textContent().catch(() => '');
    return title?.includes('Welcome') ?? false;
  }

  async isSetupScreenVisible(): Promise<boolean> {
    return await this.page.locator('.Terms-screen').isVisible().catch(() => false);
  }

  async getOwnMessages(): Promise<string[]> {
    const msgs = this.page.locator('.Chat-message-sender-own .Chat-message');
    const texts = await msgs.allTextContents();
    return texts.map(t => t.trim());
  }

  async getOtherMessages(): Promise<string[]> {
    const msgs = this.page.locator('.Chat-message-sender-other .Chat-message');
    const texts = await msgs.allTextContents();
    return texts.map(t => t.trim());
  }

  async getSysMessages(): Promise<string[]> {
    const msgs = this.page.locator('.Chat-message-sender-sys .Chat-message');
    const texts = await msgs.allTextContents();
    return texts.map(t => t.trim());
  }

  async waitForOwnMessage(text: string, timeout = 10_000) {
    await expect(
      this.page.locator('.Chat-message-sender-own .Chat-message', { hasText: text })
    ).toBeVisible({ timeout });
  }

  async waitForOtherMessage(text: string, timeout = 30_000) {
    await expect(
      this.page.locator('.Chat-message-sender-other .Chat-message', { hasText: text })
    ).toBeVisible({ timeout });
  }

  async waitForSysMessage(text: string, timeout = 10_000) {
    await expect(
      this.page.locator('.Chat-message-sender-sys .Chat-message', { hasText: text })
    ).toBeVisible({ timeout });
  }

  async isQRCodeVisible(): Promise<boolean> {
    const img = this.page.locator('.Chat-code-qr img');
    const src = await img.getAttribute('src');
    return src !== null && src.startsWith('data:image/png');
  }

  async getConnectionStatus(): Promise<string> {
    return await this.page.locator('.Chat-header-connect-feedback').textContent() ?? '';
  }

  async getTextareaValue(): Promise<string> {
    return await this.page.locator('.Chat-controls textarea').inputValue();
  }

  get raw(): Page {
    return this.page;
  }
}
