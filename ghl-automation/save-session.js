// Run on YOUR computer. Opens a visible Chrome window. You sign in yourself
// (password + 2FA). The script never sees or types them. Then it saves cookies.
const path = require('path');
const readline = require('readline');
const { chromium } = require('playwright');

(async () => {
  const out = process.env.GHL_SESSION || path.join(__dirname, 'ghl-session.json');
  // Use real Chrome if installed, else Playwright's Chromium.
  const browser = await chromium.launch({ headless: false, channel: 'chrome' })
    .catch(() => chromium.launch({ headless: false }));
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(process.env.GHL_APP_URL || 'https://app.gohighlevel.com/');

  console.log('\nSign in to GHL in the window, including 2FA.');
  console.log('Open your sub-account dashboard. Then press Enter here.\n');
  await new Promise((r) => readline.createInterface({ input: process.stdin }).once('line', r));

  await context.storageState({ path: out });
  console.log(`Saved session to ${out}. It is git-ignored. Do not share it.`);
  await browser.close();
})();
