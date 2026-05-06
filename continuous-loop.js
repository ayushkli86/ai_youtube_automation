const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { optimizeForViral } = require('./viral-content-generator');

const config = require('./config');
const VIDEO_FILE = path.resolve(config.videoFile);

let iteration = 0;
let performanceLog = [];

async function uploadVideo(optimized) {
  iteration++;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 ITERATION ${iteration}`);
  console.log('='.repeat(60));
  console.log(`📊 SEO Score: ${optimized.seoScore}/100`);
  console.log(`📝 Title: ${optimized.optimizedTitle}`);
  console.log(`🏷️ Tags: ${optimized.hashtags.join(' ')}\n`);

  const { cookies } = JSON.parse(fs.readFileSync('./session.json'));
  const normalized = cookies.map(c => ({
    ...c,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  }));

  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();

  const snap = async (name) => {
    const filename = `iter${iteration}_${name}.png`;
    await page.screenshot({ path: filename });
    console.log(`📸 ${filename}`);
  };

  try {
    console.log('🌐 Opening YouTube...');
    await page.goto('https://www.youtube.com');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    await snap('home');

    console.log('📤 Starting upload...');
    await page.locator('button[aria-label="Create"]').click();
    await page.waitForTimeout(1500);
    await snap('create_menu');

    await page.locator('text=Upload video').click();
    await page.waitForTimeout(1000);

    console.log('📁 Selecting video...');
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(VIDEO_FILE);
    await page.waitForTimeout(8000); // Wait for upload
    await snap('uploading');

    console.log('✍️ Adding content...');
    await page.fill('#textbox', optimized.optimizedTitle);
    await page.waitForTimeout(1000);
    await snap('title_added');

    const descBox = await page.locator('#textbox').nth(1);
    await descBox.fill(optimized.description + '\n\n' + optimized.hashtags.join(' '));
    await page.waitForTimeout(1000);
    await snap('description_added');

    console.log('⏭️ Next steps...');
    await page.locator('text=No, it\'s not made for kids').click();
    await page.waitForTimeout(1000);
    
    await page.locator('button:has-text("Next")').click({ timeout: 60000 });
    await page.waitForTimeout(3000);
    await snap('video_elements');

    await page.locator('button:has-text("Next")').click();
    await page.waitForTimeout(2000);
    await snap('checks');

    await page.locator('button:has-text("Next")').click();
    await page.waitForTimeout(2000);
    await snap('visibility');

    console.log('🎯 Publishing...');
    await page.locator('text=Public').click();
    await page.waitForTimeout(1000);
    await snap('public_selected');

    await page.locator('button:has-text("Publish")').click();
    await page.waitForTimeout(5000);
    await snap('published');

    console.log('✅ Upload complete!');
    
    performanceLog.push({
      iteration,
      seoScore: optimized.seoScore,
      title: optimized.optimizedTitle,
      style: optimized.style,
      timestamp: new Date().toISOString()
    });

    await browser.close();
    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    await snap('error');
    await browser.close();
    return false;
  }
}

async function runContinuousLoop(maxIterations = 5) {
  console.log('🚀 Starting Continuous Upload Loop\n');
  
  for (let i = 0; i < maxIterations; i++) {
    const optimized = optimizeForViral({
      title: `AI Automation Tutorial ${i + 1}`,
      category: 'tech',
      keywords: ['AI automation', 'YouTube growth', 'viral content'],
      duration: '10:30'
    });

    const success = await uploadVideo(optimized);
    
    if (!success) {
      console.log('⚠️ Upload failed, continuing to next iteration...');
    }

    // Save progress
    fs.writeFileSync('performance-log.json', JSON.stringify(performanceLog, null, 2));
    
    console.log(`\n⏸️ Waiting 30 seconds before next upload...\n`);
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 LOOP COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total uploads: ${performanceLog.length}`);
  console.log(`Average SEO score: ${(performanceLog.reduce((sum, p) => sum + p.seoScore, 0) / performanceLog.length).toFixed(1)}`);
  console.log('\n📊 Performance log saved to performance-log.json');
}

runContinuousLoop(5);
