const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const config = require('./config');
const VIDEO_FILE = path.resolve(config.videoFile);
const TITLE = config.videoTitle;
const DESCRIPTION = config.videoDescription;

(async () => {
  const { cookies } = JSON.parse(fs.readFileSync('./session.json'));
  const normalized = cookies.map(c => ({
    ...c,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  }));

  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 400 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();

  const clear = async () => {
    await page.evaluate(() =>
      document.querySelectorAll('ytcp-auth-confirmation-dialog, tp-yt-iron-overlay-backdrop').forEach(e => e.remove())
    );
    await page.waitForTimeout(300);
  };

  let step = 0;
  const snap = async (label) => {
    await page.screenshot({ path: `upload_s${++step}_${label}.png` });
    console.log(`[Step ${step}] ${label}`);
  };

  // 1. Home
  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await snap('home');

  // 2. Create menu
  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);
  await snap('create_menu');

  // 3. Upload dialog
  await page.locator('tp-yt-paper-item:has-text("Upload video")').click();
  await page.waitForTimeout(4000);
  await snap('upload_dialog');

  // 4. Select file
  await page.locator('input[type="file"]').setInputFiles(VIDEO_FILE);
  await page.waitForTimeout(5000);
  await snap('uploading');

  // 5. Title
  await clear();
  const titleBox = page.locator('#title-textarea #textbox').first();
  await titleBox.waitFor({ state: 'visible', timeout: 10000 });
  await titleBox.click({ force: true, clickCount: 3 });
  await titleBox.fill(TITLE);
  await snap('title');

  // 6. Description
  await clear();
  await page.locator('#description-textarea #textbox').first().click({ force: true });
  await page.locator('#description-textarea #textbox').first().fill(DESCRIPTION);
  await snap('description');

  // 7. Answer "Made for Kids" → No
  await clear();
  await page.locator('tp-yt-paper-radio-button:has-text("No, it\'s not")').click({ force: true });
  await page.waitForTimeout(1000);
  await snap('not_for_kids');

  // 8. Next → Video elements
  await clear();
  await page.locator('ytcp-button#next-button').click({ force: true });
  await page.waitForTimeout(2000);
  await snap('video_elements');

  // 9. Next → Checks
  await clear();
  await page.locator('ytcp-button#next-button').click({ force: true });
  await page.waitForTimeout(3000);
  await snap('checks');

  // 10. Next → Visibility
  await clear();
  await page.locator('ytcp-button#next-button').click({ force: true });
  await page.waitForTimeout(2000);
  await snap('visibility');

  // 11. Select Public
  await clear();
  await page.locator('ytcp-visibility-radio-button[value="PUBLIC"], tp-yt-paper-radio-button:has-text("Public")').first().click({ force: true });
  await page.waitForTimeout(1000);
  await snap('public_selected');

  // 12. Poll until Publish button is enabled (YouTube needs time after upload)
  await clear();
  console.log('Waiting for Publish to enable...');
  const doneBtn = page.locator('ytcp-button#done-button');
  for (let i = 0; i < 60; i++) {
    const disabled = await doneBtn.getAttribute('disabled').catch(() => 'true');
    const ariaDisabled = await doneBtn.locator('button').getAttribute('aria-disabled').catch(() => 'true');
    if (ariaDisabled === 'false' || ariaDisabled === null) break;
    await page.waitForTimeout(3000);
    await clear();
  }
  await doneBtn.click({ force: true });
  await page.waitForTimeout(5000);
  await snap('published');

  console.log('\nDone! Check upload_s*.png');
  await browser.close();
})();
