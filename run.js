const { chromium } = require('playwright');
const fs = require('fs');
const config = require('./config');

(async () => {
  const { cookies } = JSON.parse(fs.readFileSync('./session.json'));
  const normalized = cookies.map(c => ({
    ...c,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  }));

  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 500 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();

  const snap = async (name) => {
    await page.screenshot({ path: `${name}.png` });
    console.log(`[screenshot] ${name}.png`);
  };

  // Step 1
  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await snap('step1_home');

  // Step 2
  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);
  await snap('step2_menu');

  // Step 3
  await page.locator('tp-yt-paper-item:has-text("Create post")').click();
  await page.waitForTimeout(4000);
  await snap('step3_editor');

  // Step 4
  const editor = page.locator('#contenteditable-root');
  await editor.waitFor({ state: 'visible' });
  await editor.click();
  await editor.type(config.postText);
  await snap('step4_typed');

  // Step 5 - click Post
  await page.locator('button[aria-label="Post"][aria-disabled="false"]').click({ force: true });
  await page.waitForTimeout(4000);
  await snap('step5_submitted');

  // Step 6 - scroll to see published post
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(2000);
  await snap('step6_published');

  await browser.close();
  console.log('Done! Check step1-6 screenshots.');
})();
