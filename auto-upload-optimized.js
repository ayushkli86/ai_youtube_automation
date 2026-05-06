const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { optimizeForViral } = require('./viral-content-generator');

const config = require('./config');
const VIDEO_FILE = path.resolve(config.videoFile);

// Optimize content before upload
const optimized = optimizeForViral({
  title: config.videoTitle,
  category: 'tech',
  keywords: ['AI automation', 'YouTube growth', 'viral content'],
  duration: '10:30'
});

console.log('\n🚀 AI YouTube Automation with Viral Optimization\n');
console.log('📊 Optimized Content:');
console.log(`   Title: ${optimized.optimizedTitle}`);
console.log(`   SEO Score: ${optimized.seoScore}/100`);
console.log(`   Hashtags: ${optimized.hashtags.join(' ')}\n`);

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

  console.log('🌐 Opening YouTube...');
  await page.goto('https://www.youtube.com');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  console.log('📤 Starting upload...');
  await page.locator('button[aria-label="Create"]').click();
  await page.waitForTimeout(1500);
  await page.locator('text=Upload video').click();
  await page.waitForTimeout(1000);

  console.log('📁 Selecting video file...');
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(VIDEO_FILE);
  await page.waitForTimeout(5000);

  console.log('✍️ Adding optimized title...');
  await page.fill('#textbox', optimized.optimizedTitle);
  await page.waitForTimeout(1000);

  console.log('📝 Adding optimized description...');
  const descBox = await page.locator('#textbox').nth(1);
  await descBox.fill(optimized.description);
  await page.waitForTimeout(1000);

  console.log('🏷️ Adding hashtags...');
  await descBox.fill(optimized.description + '\n\n' + optimized.hashtags.join(' '));

  console.log('⏭️ Proceeding to next steps...');
  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(2000);

  console.log('🎯 Setting visibility to Public...');
  await page.locator('text=Public').click();
  await page.waitForTimeout(1000);

  console.log('✅ Publishing video...');
  await page.locator('button:has-text("Publish")').click();
  await page.waitForTimeout(3000);

  console.log('\n✨ Upload Complete!');
  console.log(`📊 SEO Score: ${optimized.seoScore}/100`);
  console.log(`🎯 Title: ${optimized.optimizedTitle}`);
  console.log(`🏷️ Tags: ${optimized.hashtags.join(', ')}`);

  await browser.close();
})();
