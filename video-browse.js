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
  const snap = async (n) => { await page.screenshot({ path: `v${n}.png` }); console.log(`[v${n}]`); };

  // Step 1: YouTube home
  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await snap(1);

  // Step 2: Click + Create
  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);
  await snap(2);

  // Step 3: Click "Upload video"
  await page.locator('tp-yt-paper-item:has-text("Upload video")').click();
  await page.waitForTimeout(4000);
  await snap(3);

  // Log all visible inputs/buttons on upload dialog
  const els = await page.evaluate(() =>
    [...document.querySelectorAll('input, button, [role=button]')]
      .filter(e => e.offsetParent)
      .map(e => ({ tag: e.tagName, type: e.type, label: e.getAttribute('aria-label'), text: e.textContent?.trim().substring(0, 30) }))
      .filter(e => e.label || e.text)
  );
  console.log('Upload dialog elements:', JSON.stringify(els.slice(0, 15), null, 2));

  await browser.close();
})();
