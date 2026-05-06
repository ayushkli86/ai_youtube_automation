const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const { cookies } = JSON.parse(fs.readFileSync('./session.json'));
  const normalized = cookies.map(c => ({
    ...c,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  }));

  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 600 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();

  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Click the + Create button
  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 's2_menu.png' });

  // Click "Create post"
  await page.locator('tp-yt-paper-item:has-text("Create post")').click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 's3_post_editor.png' });
  console.log('URL:', page.url());

  const els = await page.evaluate(() =>
    [...document.querySelectorAll('[contenteditable], textarea')]
      .filter(e => e.offsetParent !== null)
      .map(e => ({ tag: e.tagName, id: e.id, ph: e.placeholder || e.getAttribute('data-placeholder') }))
  );
  console.log('Editors:', JSON.stringify(els));

  await browser.close();
})();
