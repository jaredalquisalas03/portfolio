// Shared helpers: browser launch, login guard, frame-aware locators,
// screenshots, audit log, retry-once. No passwords or 2FA are ever handled here.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SESSION = process.env.GHL_SESSION || path.join(ROOT, 'ghl-session.json');
const SHOTS = path.join(ROOT, 'screenshots');
const LOGS = path.join(ROOT, 'logs');
const APP = process.env.GHL_APP_URL || 'https://app.gohighlevel.com';

// Required config. Work only in this one sub-account.
const LOCATION_ID = process.env.GHL_LOCATION_ID;
const EXPECTED_ACCOUNT = process.env.GHL_EXPECTED_ACCOUNT;

fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(LOGS, { recursive: true });

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(LOGS, `run-${runId}.jsonl`);
let shotNo = 0;

function log(what, where, result, extra = {}) {
  const row = { at: new Date().toISOString(), what, where, result, ...extra };
  fs.appendFileSync(logFile, JSON.stringify(row) + '\n');
  console.log(`[${result}] ${what} @ ${where}${extra.note ? ' - ' + extra.note : ''}`);
}

function requireConfig() {
  const missing = [];
  if (!LOCATION_ID) missing.push('GHL_LOCATION_ID');
  if (!EXPECTED_ACCOUNT) missing.push('GHL_EXPECTED_ACCOUNT');
  if (missing.length) throw new Error(`Set ${missing.join(' and ')} before running.`);
  if (!fs.existsSync(SESSION)) throw new Error(`No session file. Run "npm run login" first.`);
}

async function open({ headless = process.env.HEADLESS !== '0' } = {}) {
  requireConfig();
  console.log(`Starting browser (${headless ? 'hidden' : 'visible'}). Account: ${EXPECTED_ACCOUNT}`);
  const browser = await chromium.launch({ headless, slowMo: Number(process.env.SLOWMO || 200) });
  const context = await browser.newContext({
    storageState: SESSION,
    viewport: { width: 1440, height: 900 },
  });
  context.setDefaultTimeout(30_000);
  const page = await context.newPage();
  return { browser, context, page };
}

async function shot(page, label) {
  shotNo += 1;
  const file = path.join(SHOTS, `${runId}-${String(shotNo).padStart(2, '0')}-${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  log('screenshot', page.url(), 'ok', { file: path.relative(ROOT, file) });
  return file;
}

// GHL's login page means the session expired. Stop, never try to log in.
async function assertLoggedIn(page) {
  const url = page.url();
  const loginForm = page.getByRole('button', { name: /sign in|log in/i });
  if (/\/login|\/oauth|signin/i.test(url) || (await loginForm.isVisible().catch(() => false))) {
    log('session check', url, 'BLOCKED', { note: 'login page shown' });
    throw new Error('GHL shows the login page. Please run "npm run login" and sign in again.');
  }
}

// Navigate, then wait for app state (not a fixed sleep).
async function go(page, urlPath, readyLocatorFn, label) {
  const url = APP + urlPath;
  await retryOnce(`goto ${label}`, async () => {
    console.log(`Opening ${label}... (GHL can take up to a minute)`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // GHL keeps sockets open, so "network idle" may never come. Cap the wait.
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await assertLoggedIn(page);
    if (readyLocatorFn) {
      console.log(`Waiting for ${label} to render...`);
      await findAnywhere(page, readyLocatorFn);
    }
  });
  log('navigate', url, 'ok');
  await shot(page, label);
}

// Retry once on timeout. Never loop forever.
async function retryOnce(what, fn) {
  try {
    return await fn();
  } catch (err) {
    if (!/timeout/i.test(String(err))) throw err;
    log(what, '-', 'retry', { note: 'timeout, retrying once' });
    return await fn();
  }
}

// The workflow builder lives in an iframe. Look in the page first, then every frame.
// fn receives a Page or Frame and returns a Locator.
async function findAnywhere(page, fn, { timeout = 20_000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const scope of [page, ...page.frames()]) {
      // Check several matches: GHL often has a hidden copy of the same text first.
      const all = fn(scope);
      const n = Math.min(await all.count().catch(() => 0), 10);
      for (let i = 0; i < n; i++) {
        const loc = all.nth(i);
        if (await loc.isVisible().catch(() => false)) return loc;
      }
    }
    await page.waitForTimeout(500); // short poll between frame scans, bounded by deadline
  }
  throw new Error('Timeout: element not found in page or any frame');
}

// Hard guard: these buttons must never be clicked by the scripts.
const FORBIDDEN = /^(publish|send|send now|charge|delete|remove|test workflow)$/i;
async function safeClick(page, fn, what) {
  const loc = await findAnywhere(page, fn);
  const text = ((await loc.innerText().catch(() => '')) || '').trim();
  if (FORBIDDEN.test(text)) {
    log(what, page.url(), 'BLOCKED', { note: `refused to click "${text}"` });
    throw new Error(`Safety stop: script tried to click "${text}".`);
  }
  await retryOnce(what, () => loc.click());
  log(what, page.url(), 'ok', { note: text.slice(0, 60) });
  return loc;
}

module.exports = {
  APP, LOCATION_ID, EXPECTED_ACCOUNT, logFile,
  open, shot, log, go, retryOnce, findAnywhere, safeClick, assertLoggedIn,
};
