const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { optimizeForViral } = require('./viral-content-generator');
const config = require('./config');

let iteration = 0;
let stuckCount = 0;
let strategies = [];

async function takeDebugScreenshot(page, reason) {
  const filename = `debug_iter${iteration}_${reason}_${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`🔍 Debug screenshot: ${filename}`);
  return filename;
}

async function analyzeStuckState(page) {
  const state = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const nextBtn = buttons.find(b => b.textContent.includes('Next'));
    const publishBtn = buttons.find(b => b.textContent.includes('Publish'));
    
    return {
      hasNextButton: !!nextBtn,
      nextButtonEnabled: nextBtn ? !nextBtn.disabled : false,
      hasPublishButton: !!publishBtn,
      publishButtonEnabled: publishBtn ? !publishBtn.disabled : false,
      url: window.location.href,
      visibleText: document.body.innerText.substring(0, 500)
    };
  });
  
  console.log('📊 Page state:', JSON.stringify(state, null, 2));
  return state;
}

async function tryAlternativeAction(page, attempt) {
  console.log(`🔄 Trying alternative action #${attempt}...`);
  
  const actions = [
    async () => {
      console.log('   → Waiting longer for processing...');
      await page.waitForTimeout(10000);
    },
    async () => {
      console.log('   → Looking for enabled Next button...');
      await page.locator('button:has-text("Next"):not([disabled])').click({ timeout: 5000 });
    },
    async () => {
      console.log('   → Trying NEXT button by aria-label...');
      await page.locator('button[aria-label*="Next"]').click({ timeout: 5000 });
    },
    async () => {
      console.log('   → Clicking via JavaScript...');
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const next = btns.find(b => b.textContent.includes('Next') && !b.disabled);
        if (next) next.click();
      });
      await page.waitForTimeout(2000);
    },
    async () => {
      console.log('   → Pressing Enter key...');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }
  ];
  
  if (attempt < actions.length) {
    await actions[attempt]();
    return true;
  }
  return false;
}

async function smartUpload(optimized) {
  iteration++;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔄 ITERATION ${iteration}`);
  console.log('='.repeat(60));

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
    await page.goto('https://www.youtube.com');
    await page.waitForTimeout(3000);
    await snap('01_home');

    await page.locator('button[aria-label="Create"]').click();
    await page.waitForTimeout(1500);
    await snap('02_menu');

    await page.locator('text=Upload video').click();
    await page.waitForTimeout(1000);

    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(config.videoFile));
    console.log('📁 Video uploading...');
    await page.waitForTimeout(10000);
    await snap('03_uploading');

    await page.fill('#textbox', optimized.optimizedTitle);
    await page.waitForTimeout(1000);
    
    const descBox = await page.locator('#textbox').nth(1);
    await descBox.fill(optimized.description + '\n\n' + optimized.hashtags.join(' '));
    await page.waitForTimeout(1000);
    await snap('04_content_added');

    // Smart "Not for kids" selection
    try {
      await page.locator('text=No, it\'s not made for kids').click({ timeout: 5000 });
    } catch (e) {
      console.log('⚠️ Kids option not found, continuing...');
    }

    // Smart Next button handling with retry
    console.log('⏭️ Clicking Next (with smart retry)...');
    let nextSuccess = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await takeDebugScreenshot(page, `before_next_attempt${attempt}`);
        const state = await analyzeStuckState(page);
        
        if (!state.nextButtonEnabled) {
          console.log(`⏳ Next button disabled, trying alternative ${attempt + 1}...`);
          await tryAlternativeAction(page, attempt);
        } else {
          await page.locator('button:has-text("Next")').click({ timeout: 10000 });
          await page.waitForTimeout(3000);
          nextSuccess = true;
          break;
        }
      } catch (e) {
        console.log(`   ❌ Attempt ${attempt + 1} failed: ${e.message}`);
        if (attempt === 4) {
          await takeDebugScreenshot(page, 'stuck_at_next');
          throw new Error('Could not proceed past first Next button');
        }
      }
    }
    
    if (nextSuccess) await snap('05_video_elements');

    // Continue with remaining steps
    await page.locator('button:has-text("Next")').click({ timeout: 30000 });
    await page.waitForTimeout(2000);
    await snap('06_checks');

    await page.locator('button:has-text("Next")').click({ timeout: 30000 });
    await page.waitForTimeout(2000);
    await snap('07_visibility');

    await page.locator('text=Public').click();
    await page.waitForTimeout(1000);
    await snap('08_public');

    await page.locator('button:has-text("Publish")').click();
    await page.waitForTimeout(5000);
    await snap('09_published');

    console.log('✅ Upload successful!');
    await browser.close();
    return { success: true, seoScore: optimized.seoScore };

  } catch (error) {
    console.error('❌ Error:', error.message);
    await takeDebugScreenshot(page, 'error_state');
    await browser.close();
    stuckCount++;
    return { success: false, error: error.message };
  }
}

async function runSelfHealingLoop(maxIterations = 3) {
  console.log('🚀 Self-Healing Upload Loop Started\n');
  const results = [];

  for (let i = 0; i < maxIterations; i++) {
    const optimized = optimizeForViral({
      title: `AI Tutorial ${i + 1}`,
      category: 'tech',
      keywords: ['AI automation', 'YouTube', 'tutorial'],
      duration: '10:30'
    });

    console.log(`\n📊 Optimized: ${optimized.optimizedTitle}`);
    console.log(`   SEO: ${optimized.seoScore}/100`);
    
    const result = await smartUpload(optimized);
    results.push(result);

    if (result.success) {
      console.log('✅ Success! Waiting 30s before next...');
      await new Promise(r => setTimeout(r, 30000));
    } else {
      console.log('⚠️ Failed, analyzing and retrying with improvements...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`Successful: ${results.filter(r => r.success).length}/${results.length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}/${results.length}`);
  console.log(`Stuck count: ${stuckCount}`);
  
  fs.writeFileSync('self-healing-log.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Log saved to self-healing-log.json');
}

runSelfHealingLoop(3);
