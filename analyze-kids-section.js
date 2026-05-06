const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { optimizeForViral } = require('./viral-content-generator');
const config = require('./config');

async function analyzeAndScreenshot(page, step, description) {
  console.log(`\n📍 STEP ${step}: ${description}`);
  
  // Take screenshot
  const filename = `analyze_step${step}_${description.replace(/\s+/g, '_')}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`   📸 Screenshot: ${filename}`);
  
  // Analyze page state
  const analysis = await page.evaluate(() => {
    // Find all radio buttons
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
    const radioInfo = radios.map(r => ({
      name: r.name,
      value: r.value,
      checked: r.checked,
      id: r.id,
      ariaLabel: r.getAttribute('aria-label')
    }));
    
    // Find kids-related elements
    const kidsText = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent.includes('made for kids') || 
      el.textContent.includes('not made for kids') ||
      el.textContent.includes('audience')
    ).map(el => ({
      tag: el.tagName,
      text: el.textContent.substring(0, 100),
      id: el.id,
      className: el.className
    }));
    
    // Find Next button state
    const nextButtons = Array.from(document.querySelectorAll('button')).filter(b => 
      b.textContent.includes('Next')
    ).map(b => ({
      text: b.textContent,
      disabled: b.disabled,
      ariaLabel: b.getAttribute('aria-label')
    }));
    
    return {
      url: window.location.href,
      radios: radioInfo,
      kidsElements: kidsText.slice(0, 5),
      nextButtons,
      pageTitle: document.title
    };
  });
  
  console.log('   📊 Analysis:', JSON.stringify(analysis, null, 2));
  
  // Save analysis to file
  fs.appendFileSync('kids-section-analysis.json', 
    JSON.stringify({ step, description, analysis, timestamp: new Date().toISOString() }, null, 2) + ',\n'
  );
  
  return analysis;
}

async function testKidsSection() {
  console.log('🔍 ANALYZING KIDS SECTION ISSUE\n');
  
  const { cookies } = JSON.parse(fs.readFileSync('./session.json'));
  const normalized = cookies.map(c => ({
    ...c,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  }));

  const browser = await chromium.launch({ channel: 'msedge', headless: false, slowMo: 500 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addCookies(normalized);
  const page = await ctx.newPage();

  try {
    // Step 1: Home
    await page.goto('https://www.youtube.com');
    await page.waitForTimeout(3000);
    await analyzeAndScreenshot(page, 1, 'home_page');

    // Step 2: Create menu
    await page.locator('button[aria-label="Create"]').click();
    await page.waitForTimeout(1500);
    await analyzeAndScreenshot(page, 2, 'create_menu');

    // Step 3: Upload dialog
    await page.locator('text=Upload video').click();
    await page.waitForTimeout(1000);
    await analyzeAndScreenshot(page, 3, 'upload_dialog');

    // Step 4: File selected
    const optimized = optimizeForViral({
      title: 'Test Video',
      category: 'tech',
      keywords: ['test'],
      duration: '10:30'
    });
    
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.resolve(config.videoFile));
    console.log('📁 Video uploading...');
    await page.waitForTimeout(8000);
    await analyzeAndScreenshot(page, 4, 'video_uploading');

    // Step 5: Title field
    await page.fill('#textbox', optimized.optimizedTitle);
    await page.waitForTimeout(1000);
    await analyzeAndScreenshot(page, 5, 'title_filled');

    // Step 6: Description field
    const descBox = await page.locator('#textbox').nth(1);
    await descBox.fill(optimized.description);
    await page.waitForTimeout(1000);
    await analyzeAndScreenshot(page, 6, 'description_filled');

    // Step 7: CRITICAL - Kids section analysis
    console.log('\n🎯 ANALYZING KIDS SECTION...');
    await page.waitForTimeout(2000);
    const beforeKids = await analyzeAndScreenshot(page, 7, 'before_kids_selection');
    
    // Try multiple methods to find and click "Not made for kids"
    console.log('\n🔄 Attempting different methods to select "Not made for kids"...\n');
    
    // Method 1: Direct text click
    console.log('Method 1: Direct text click');
    try {
      await page.locator('text=No, it\'s not made for kids').click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      await analyzeAndScreenshot(page, 8, 'method1_text_click');
      console.log('✅ Method 1 worked!');
    } catch (e) {
      console.log('❌ Method 1 failed:', e.message);
    }

    // Method 2: Radio button by name
    console.log('\nMethod 2: Radio button by name');
    try {
      await page.locator('input[name*="VIDEO_MADE_FOR_KIDS"][value="VIDEO_MADE_FOR_KIDS_NOT_MFK"]').click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      await analyzeAndScreenshot(page, 9, 'method2_radio_name');
      console.log('✅ Method 2 worked!');
    } catch (e) {
      console.log('❌ Method 2 failed:', e.message);
    }

    // Method 3: Click parent element
    console.log('\nMethod 3: Click parent label/div');
    try {
      await page.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('*'));
        const notForKids = labels.find(el => 
          el.textContent.includes('not made for kids') && 
          el.textContent.length < 100
        );
        if (notForKids) notForKids.click();
      });
      await page.waitForTimeout(1000);
      await analyzeAndScreenshot(page, 10, 'method3_parent_click');
      console.log('✅ Method 3 worked!');
    } catch (e) {
      console.log('❌ Method 3 failed:', e.message);
    }

    // Method 4: Find radio and click via JS
    console.log('\nMethod 4: JavaScript radio selection');
    try {
      await page.evaluate(() => {
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const notForKids = radios.find(r => 
          r.value.includes('NOT_MFK') || 
          r.getAttribute('aria-label')?.includes('not made for kids')
        );
        if (notForKids) {
          notForKids.checked = true;
          notForKids.click();
          notForKids.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await page.waitForTimeout(1000);
      await analyzeAndScreenshot(page, 11, 'method4_js_radio');
      console.log('✅ Method 4 worked!');
    } catch (e) {
      console.log('❌ Method 4 failed:', e.message);
    }

    // Step 12: Check final state
    const afterKids = await analyzeAndScreenshot(page, 12, 'after_kids_attempts');
    
    // Step 13: Try to click Next
    console.log('\n⏭️ Attempting to click Next button...');
    try {
      await page.locator('button:has-text("Next")').click({ timeout: 5000 });
      await page.waitForTimeout(2000);
      await analyzeAndScreenshot(page, 13, 'after_next_click');
      console.log('✅ Next button clicked successfully!');
    } catch (e) {
      console.log('❌ Next button failed:', e.message);
      await analyzeAndScreenshot(page, 14, 'next_button_failed');
    }

    console.log('\n✅ Analysis complete! Check screenshots and kids-section-analysis.json');
    
    await page.waitForTimeout(5000);
    await browser.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error_final.png', fullPage: true });
    await browser.close();
  }
}

testKidsSection();
