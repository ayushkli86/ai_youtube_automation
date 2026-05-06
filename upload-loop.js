const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const config = require('./config');

(async () => {
  const { cookies } = JSON.parse(fs.readFileSync('./session.json'));
  const normalized = cookies.map(c => ({ ...c, sameSite: ['Strict','Lax','None'].includes(c.sameSite) ? c.sameSite : 'Lax' }));
  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();

  let snap = 0;
  const shot = async (label) => {
    const file = `loop_${++snap}_${label}.png`;
    await page.screenshot({ path: file });
    console.log(`[${snap}] ${label} → ${file}`);
    return file;
  };

  const clear = async () => {
    await page.evaluate(() =>
      document.querySelectorAll('ytcp-auth-confirmation-dialog,tp-yt-iron-overlay-backdrop').forEach(e => e.remove())
    );
    await page.waitForTimeout(400);
  };

  const isVisible = async (sel) => page.locator(sel).isVisible({ timeout: 2000 }).catch(() => false);

  // --- START ---
  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  await shot('home');

  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);
  await shot('create_menu');

  await page.locator('tp-yt-paper-item:has-text("Upload video")').click();
  await page.waitForTimeout(4000);
  await shot('upload_dialog');

  await page.locator('input[type="file"]').setInputFiles(path.resolve(config.videoFile));
  await page.waitForTimeout(6000);
  await shot('file_uploading');

  await clear();
  await page.locator('#title-textarea #textbox').first().click({ force: true, clickCount: 3 });
  await page.locator('#title-textarea #textbox').first().fill(config.videoTitle);
  await shot('title_filled');

  await clear();
  await page.locator('tp-yt-paper-radio-button:has-text("No, it")').click({ force: true });
  await page.waitForTimeout(800);
  await shot('not_for_kids');

  // Next x3
  for (const label of ['video_elements', 'checks', 'visibility']) {
    await clear();
    await page.locator('ytcp-button#next-button').click({ force: true });
    await page.waitForTimeout(2000);
    await shot(label);
  }

  await clear();
  await page.locator('tp-yt-paper-radio-button:has-text("Public")').first().click({ force: true });
  await page.waitForTimeout(1000);
  await shot('public_selected');

  // LOOP: screenshot every 5s, check if Publish enabled, click when ready
  console.log('\n--- POLLING PUBLISH BUTTON ---');
  let published = false;
  for (let i = 1; i <= 40; i++) {
    await clear();
    const ariaDisabled = await page.locator('ytcp-button#done-button button').getAttribute('aria-disabled').catch(() => 'true');
    const status = await page.locator('.progress-label, ytcp-video-upload-progress').textContent().catch(() => '');
    await shot(`poll_${i}_disabled=${ariaDisabled}_${status.trim().replace(/\s+/g,'_').substring(0,20)}`);
    console.log(`  Poll ${i}: aria-disabled=${ariaDisabled} | status="${status.trim()}"`);

    if (ariaDisabled === 'false' || ariaDisabled === null) {
      console.log('Publish button ENABLED — clicking!');
      await page.locator('ytcp-button#done-button').click({ force: true });
      await page.waitForTimeout(5000);
      await shot('PUBLISHED');
      published = true;
      break;
    }
    await page.waitForTimeout(5000);
  }

  if (!published) console.log('Timed out waiting for Publish to enable.');
  await browser.close();
})();
