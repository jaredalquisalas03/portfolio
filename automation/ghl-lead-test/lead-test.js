// GHL funnel lead test: submits the Primal Fitness Lead Capture form as a fake lead.
// Usage: NODE_PATH=$(npm root -g) node lead-test.js
const { chromium } = require('playwright');
const fs = require('fs');

const FORM_ID = process.env.FORM_ID || 'W5THnK8yBFC5KBJEuuOK';
const URL = `https://api.leadconnectorhq.com/widget/form/${FORM_ID}`;
const stamp = Date.now();
const lead = {
  first: 'Test',
  last: `Lead${stamp}`,
  email: `test+${stamp}@example.com`,
  phone: '+14155550132',
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const steps = [];
  const step = (name, ok, note = '') => { steps.push({ name, ok, note }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${note}`); };

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name="email"]', { timeout: 20000 });
    step('Form loaded', true);

    await page.fill('input[name="first_name"]', lead.first);
    await page.fill('input[name="last_name"]', lead.last);
    await page.fill('input[name="phone"]', lead.phone);
    await page.fill('input[name="email"]', lead.email);
    await page.locator('input[name="terms_and_conditions"]').first().check({ force: true });
    step('Fields filled', true, lead.email);

    const submitResp = page.waitForResponse(
      r => r.request().method() === 'POST' && /forms\/submit/i.test(r.url()), { timeout: 20000 }
    ).catch(() => null);
    await page.click('button[type="submit"]');
    const resp = await submitResp;
    await page.waitForTimeout(4000);

    const body = (await page.innerText('body')).replace(/\s+/g, ' ');
    const thanked = /thank|success|submitted|received/i.test(body);
    step('Submit request sent', !!resp, resp ? `HTTP ${resp.status()}` : 'no submission request. Captcha may be blocking.');
    step('Thank-you state shown', thanked, thanked ? '' : body.slice(0, 160));
  } catch (e) {
    step('Run', false, e.message.split('\n')[0]);
  }

  await page.screenshot({ path: `result-${stamp}.png`, fullPage: true });
  fs.writeFileSync('last-run.json', JSON.stringify({ lead, steps }, null, 2));
  await browser.close();
  console.log('\nLead email for API check:', lead.email);
  process.exit(steps.every(s => s.ok) ? 0 : 1);
})();
