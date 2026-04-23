import { type Page, expect } from '@playwright/test';

export class ChatPage {
  constructor(private page: Page) {}

  async goInitiator() {
    await this.page.goto('/');
  }

  async goRespondent(token: string) {
    await this.page.goto(`/?token=${token}`);
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

  async acceptTerms() {
    await this.sendMessage('/a');
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
