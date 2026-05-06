const { chromium } = require('playwright');
const fs = require('fs');
const config = require('./config');

(async () => {
  if (!fs.existsSync('./session.json')) {
    console.error('No session.json. Run: node gather-session.js first');
    process.exit(1);
  }

  const { cookies } = JSON.parse(fs.readFileSync('./session.json', 'utf-8'));
  const normalized = cookies.map(c => ({
    ...c,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  }));

  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 500 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();

  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  console.log('Logged in');

  // Step 1: Click + Create
  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);

  // Step 2: Click "Create post"
  await page.locator('tp-yt-paper-item:has-text("Create post")').click();
  await page.waitForTimeout(4000);
  console.log('Post editor opened');

  // Step 3: Type into the post editor
  const editor = page.locator('#contenteditable-root');
  await editor.waitFor({ state: 'visible' });
  await editor.click();
  await editor.type(config.postText);
  console.log('Text entered:', config.postText);

  // Step 4: Click the enabled Post button (not the disabled one inside #post-button)
  await page.locator('button[aria-label="Post"][aria-disabled="false"]').click({ force: true });
  await page.waitForTimeout(4000);
  console.log('Post submitted!');

  await page.screenshot({ path: 'result.png' });
  await browser.close();
})();
