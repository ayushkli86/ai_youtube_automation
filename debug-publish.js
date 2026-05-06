const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const config = require('./config');

(async () => {
  const { cookies } = JSON.parse(fs.readFileSync('./session.json'));
  const normalized = cookies.map(c => ({ ...c, sameSite: ['Strict','Lax','None'].includes(c.sameSite) ? c.sameSite : 'Lax' }));
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 400 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();
  const clear = async () => {
    await page.evaluate(() => document.querySelectorAll('ytcp-auth-confirmation-dialog,tp-yt-iron-overlay-backdrop').forEach(e => e.remove()));
    await page.waitForTimeout(300);
  };

  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);
  await page.locator('tp-yt-paper-item:has-text("Upload video")').click();
  await page.waitForTimeout(4000);
  await page.locator('input[type="file"]').setInputFiles(path.resolve(config.videoFile));
  await page.waitForTimeout(5000);
  await clear();
  await page.locator('#title-textarea #textbox').first().click({ force: true, clickCount: 3 });
  await page.locator('#title-textarea #textbox').first().fill(config.videoTitle);
  await clear();
  await page.locator('tp-yt-paper-radio-button:has-text("No, it")').click({ force: true });
  await page.waitForTimeout(1000);
  for (let i = 0; i < 3; i++) {
    await clear();
    await page.locator('ytcp-button#next-button').click({ force: true });
    await page.waitForTimeout(2000);
  }
  await clear();
  await page.locator('tp-yt-paper-radio-button:has-text("Public")').first().click({ force: true });
  await page.waitForTimeout(2000);

  // Check done button
  const btnInfo = await page.evaluate(() => {
    const btn = document.querySelector('ytcp-button#done-button button');
    return btn ? { disabled: btn.disabled, ariaDisabled: btn.getAttribute('aria-disabled'), text: btn.textContent.trim() } : 'NOT FOUND';
  });
  console.log('Publish button:', JSON.stringify(btnInfo));
  await page.screenshot({ path: 'visibility_check.png' });
  await browser.close();
})();
