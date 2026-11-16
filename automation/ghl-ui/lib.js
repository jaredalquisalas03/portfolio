// Shared helpers: session reuse, audit log, screenshots, safety checks.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.GHL_BASE || 'https://app.gohighlevel.com';
const LOCATION_ID = process.env.GHL_LOCATION_ID || 'W19C9r2NOz3TquKYLWsg';
const ACCOUNT_NAME = process.env.GHL_ACCOUNT_NAME || "Jared Alquisalas's Account";
const SESSION_FILE = path.join(__dirname, 'ghl-session.json');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const SHOT_DIR = path.join(__dirname, 'screenshots', RUN_ID);
const LOG_FILE = path.join(__dirname, 'logs', `run-${RUN_ID}.jsonl`);
fs.mkdirSync(SHOT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

let stepNo = 0;
function log(what, where, result) {
  const row = { t: new Date().toISOString(), step: ++stepNo, what, where, result };
  fs.appendFileSync(LOG_FILE, JSON.stringify(row) + '\n');
  console.log(`[${row.step}] ${what} | ${where} | ${result}`);
}

async function shot(page, name) {
  const file = path.join(SHOT_DIR, `${String(stepNo).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  log('screenshot', page.url(), file);
  return file;
}

// Run an action, retry once on timeout, never loop.
async function withRetry(label, fn) {
  try { return await fn(); }
  catch (e) {
    if (!/Timeout/i.test(e.message)) throw e;
    log(`retry after timeout: ${label}`, '-', e.message.split('\n')[0]);
    return await fn();
  }
}

async function openSession() {
  if (!fs.existsSync(SESSION_FILE)) {
    throw new Error('No ghl-session.json. Run: npm run save-session');
  }
  const browser = await chromium.launch({ slowMo: 200 });
  const context = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  return { browser, context, page };
}

// Stop and ask the user to sign in again if GHL shows the login page.
async function assertLoggedIn(page) {
  const url = page.url();
  const onLogin = /\/login|\/sign-?in|\/auth/i.test(url) ||
    (await page.getByRole('button', { name: /sign in|log in/i }).count()) > 0;
  if (onLogin) {
    await shot(page, 'login-page-detected');
    throw new Error('SESSION_EXPIRED: GHL shows the login page. Sign in again with: npm run save-session');
  }
}

// Confirm the header shows the expected sub-account before touching anything.
async function assertAccount(page) {
  await page.waitForLoadState('domcontentloaded');
  const key = new RegExp(process.env.GHL_ACCOUNT_MATCH || 'Alquisalas', 'i');
  const found = await page.getByText(key).first()
    .waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
  if (!found || !page.url().includes(LOCATION_ID)) {
    await shot(page, 'account-mismatch');
    throw new Error(`ACCOUNT_CHECK_FAILED: expected "${ACCOUNT_NAME}" / ${LOCATION_ID}. Stopping.`);
  }
  log('account confirmed', page.url(), ACCOUNT_NAME);
}

module.exports = { BASE, LOCATION_ID, ACCOUNT_NAME, SESSION_FILE, log, shot, withRetry, openSession, assertLoggedIn, assertAccount };
