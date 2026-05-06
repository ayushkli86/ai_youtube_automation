const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VIDEO_PATH = 'C:\\Users\\DELL\\Downloads\\problem.mp4';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: false });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  // Load video as base64 blob to bypass file:// restrictions
  const videoData = fs.readFileSync(VIDEO_PATH).toString('base64');

  await page.setContent(`
    <video id="v" style="width:100%;height:100vh;background:#000" controls></video>
    <script>
      const b64 = "${videoData}";
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i);
      const blob = new Blob([arr], {type:'video/mp4'});
      document.getElementById('v').src = URL.createObjectURL(blob);
    </script>
  `);

  await page.waitForTimeout(3000);

  // Seek to different timestamps and capture frames
  for (const t of [1, 3, 5, 10]) {
    await page.evaluate((time) => {
      const v = document.getElementById('v');
      v.currentTime = time;
    }, t);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `frame_${t}s.png` });
    console.log(`Frame at ${t}s captured`);
  }

  await browser.close();
})();
