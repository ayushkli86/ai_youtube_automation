const { chromium } = require('playwright');
const fs = require('fs');

// Connects to your EXISTING Edge session via remote debugging
// Run Edge with: msedge --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Microsoft\Edge\User Data" --profile-directory=Default
(async () => {
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9222');
  } catch (e) {
    console.error('ERROR: Could not connect to Edge on port 9222.');
    console.error('Close Edge, then run this command first:');
    console.error('');
    console.error('  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\\Microsoft\\Edge\\User Data" --profile-directory=Default https://studio.youtube.com');
    console.error('');
    console.error('Then run this script again.');
    process.exit(1);
  }

  const contexts = browser.contexts();
  const context = contexts[0];

  const cookies = await context.cookies([
    'https://accounts.google.com',
    'https://youtube.com',
    'https://www.youtube.com',
    'https://studio.youtube.com',
  ]);

  const normalized = cookies.map(c => ({
    ...c,
    sameSite: ['Strict', 'Lax', 'None'].includes(c.sameSite) ? c.sameSite : 'Lax',
  }));

  fs.writeFileSync('./session.json', JSON.stringify({ cookies: normalized }, null, 2));
  console.log(`[OK] Saved ${cookies.length} cookies to session.json`);

  const KEY = ['SID','HSID','SSID','APISID','SAPISID','__Secure-3PSID','__Secure-1PSID','YSC','VISITOR_INFO1_LIVE'];
  console.log('\n[KEY TOKENS FOUND]');
  cookies.filter(c => KEY.includes(c.name))
         .forEach(c => console.log(`  ${c.name} [${c.domain}] = ${c.value.substring(0,20)}...`));

  await browser.close();
})();
