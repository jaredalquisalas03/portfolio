// Opens a real Chrome window. YOU sign in (password + 2FA). Then press Enter here.
// The script never types credentials. It only saves the session cookies.
const { chromium } = require('playwright');
const readline = require('readline');
const { BASE, SESSION_FILE } = require('./lib');

(async () => {
  let browser;
  try { browser = await chromium.launch({ headless: false, channel: 'chrome' }); }
  catch { browser = await chromium.launch({ headless: false }); }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`);
  console.log('Sign in in the browser window. Open your sub-account dashboard.');
  console.log('When you can see the dashboard, come back here and press Enter.');
  await new Promise(r => readline.createInterface({ input: process.stdin }).once('line', r));
  await context.storageState({ path: SESSION_FILE });
  console.log(`Saved ${SESSION_FILE}. It is git-ignored. Do not share it.`);
  await browser.close();
  process.exit(0);
})();
