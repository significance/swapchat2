import { test, expect } from '@playwright/test';
import { ChatPage } from './helpers/chat-page';
import { setupInitiator } from './helpers/two-party';
import type { BrowserContext } from '@playwright/test';

const ALL_THEMES = ['classic', 'turbo', 'norton', 'matrix', 'amber', 'cga', 'neon', 'tron'];

test.describe('themes', () => {
  let page: ChatPage;
  let context: BrowserContext;

  test.afterEach(async () => {
    await context?.close();
  });

  test('/theme lists all themes', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/theme');
    await page.waitForSysMessage('Themes:');
    const sys = await page.getSysMessages();
    const themeList = sys.find(m => m.includes('Themes:'));
    for (const t of ALL_THEMES) {
      expect(themeList).toContain(t);
    }
  });

  test('/theme marks current theme with *', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/theme');
    await page.waitForSysMessage('* classic');
  });

  test('/theme unknown shows error', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/theme bogus');
    await page.waitForSysMessage('Unknown theme: bogus');
  });

  for (const themeName of ALL_THEMES) {
    test(`/theme ${themeName} applies data-theme attribute`, async ({ browser }) => {
      ({ page, context } = await setupInitiator(browser));
      await page.sendMessage(`/theme ${themeName}`);
      await page.waitForSysMessage(`Theme set to ${themeName}`);
      const attr = await page.raw.locator('html').getAttribute('data-theme');
      expect(attr).toBe(themeName);
      // Pause on ~1/3 of themes for visual inspection in headed mode
      if (['turbo', 'matrix', 'neon'].includes(themeName)) {
        await page.raw.waitForTimeout(1500);
      }
    });
  }

  test('/theme tron shows easter egg smiley', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/theme tron');
    await page.waitForSysMessage('Theme set to tron');
    await expect(page.raw.locator('.Chat-prompt-easter-egg')).toBeVisible();
    await expect(page.raw.locator('.Chat-prompt-easter-egg')).toHaveText(':)');
    await page.raw.waitForTimeout(1500);
  });

  test('/theme classic hides easter egg', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/theme tron');
    await page.waitForSysMessage('Theme set to tron');
    await expect(page.raw.locator('.Chat-prompt-easter-egg')).toBeVisible();
    await page.sendMessage('/theme classic');
    await page.waitForSysMessage('Theme set to classic');
    await expect(page.raw.locator('.Chat-prompt-easter-egg')).not.toBeVisible();
  });

  test('theme persists in localStorage', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.sendMessage('/theme neon');
    await page.waitForSysMessage('Theme set to neon');
    const stored = await page.raw.evaluate(() => localStorage.getItem('swapchat_theme'));
    expect(stored).toBe('neon');
  });

  test('theme loads from localStorage on reload', async ({ browser }) => {
    ({ page, context } = await setupInitiator(browser));
    await page.raw.evaluate(() => localStorage.setItem('swapchat_theme', 'matrix'));
    await page.raw.reload();
    await page.dismissOverlays();
    await page.raw.waitForTimeout(500);
    const attr = await page.raw.locator('html').getAttribute('data-theme');
    expect(attr).toBe('matrix');
  });
});
