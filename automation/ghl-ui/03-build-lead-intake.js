// Stage 3: builds "WP | 01 Lead intake" in DRAFT. Never publishes.
// UNTESTED against your UI. Each step stops on failure with a screenshot. No loops.
// Usage: node 03-build-lead-intake.js [--from N] [--only N] [--pause]
//   --pause  waits for Enter after each step so you can review the screenshot.
const readline = require('readline');
const { BASE, LOCATION_ID, log, shot, withRetry, openSession, assertLoggedIn, assertAccount } = require('./lib');

const NAME = 'WP | 01 Lead intake';
const FORM = 'Primal Fitness Lead Capture';
const PIPELINE_STAGE = 'New Lead';
const EMAIL_SUBJECT = 'Got your details, {{contact.first_name}}';
const EMAIL_BODY = "Thanks for reaching out to Primal Fitness. We'll review your details and message you within 24 hours. Reply here if you have questions.";
const SMS_BODY = "Hi {{contact.first_name}}, it's Primal Fitness. Thanks for signing up. Want to book a quick call?";
const NOTIFY_SUBJECT = 'New lead: {{contact.name}}';

const args = process.argv.slice(2);
const argVal = k => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : null; };
const FROM = argVal('--from') || 1, ONLY = argVal('--only'), PAUSE = args.includes('--pause');
const ask = q => new Promise(r => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, a => { rl.close(); r(a); }); });

// The builder may render in the page or inside an iframe. Return the scope that has the text.
async function scope(page, probe) {
  for (const s of [page, ...page.frames().filter(f => f !== page.mainFrame())]) {
    if (await probe(s).count().catch(() => 0)) return s;
  }
  return page;
}
const byText = (s, t) => s.getByText(t, { exact: false }).first();

async function openDrawerAndPick(page, search) {
  const s = await scope(page, x => x.getByPlaceholder(/search/i));
  await s.getByPlaceholder(/search/i).first().fill(search);
  await byText(s, search).click();
}
async function saveAction(page) {
  const s = await scope(page, x => x.getByRole('button', { name: /^save/i }));
  await s.getByRole('button', { name: /^save/i }).first().click();
}
async function addActionPlus(page) {
  // The "+" under the last node. Falls back to the first add-step control.
  const s = await scope(page, x => x.locator('[class*="add"], [aria-label*="add" i]'));
  await s.getByRole('button', { name: /add action|\+/i }).last().click();
}

const steps = [
  ['Open workflows list', async page => {
    await withRetry('workflows', () => page.goto(`${BASE}/v2/location/${LOCATION_ID}/automation/workflows`, { waitUntil: 'domcontentloaded' }));
    await assertLoggedIn(page); await assertAccount(page);
    const dup = await page.getByText(NAME, { exact: true }).count();
    if (dup) throw new Error(`DUPLICATE_GUARD: "${NAME}" already exists. Stopping.`);
  }],
  ['Create workflow from scratch', async page => {
    await page.getByRole('button', { name: /create workflow/i }).first().click();
    await page.getByText(/start from scratch/i).first().click();
    await page.getByRole('button', { name: /^(create|continue|save)/i }).first().click().catch(() => {});
    await page.waitForLoadState('domcontentloaded');
  }],
  ['Rename workflow', async page => {
    const s = await scope(page, x => x.getByText(/new workflow/i));
    await byText(s, 'New Workflow').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(NAME);
    await page.keyboard.press('Enter');
  }],
  ['Trigger: Form Submitted', async page => {
    const s = await scope(page, x => x.getByText(/add (new )?trigger/i));
    await byText(s, 'Add New Trigger').click().catch(() => byText(s, 'Add Trigger').click());
    await openDrawerAndPick(page, 'Form Submitted');
    const s2 = await scope(page, x => x.getByText(/add filters/i));
    await byText(s2, 'Add filters').click().catch(() => {});
    await s2.getByText(/select filter|filter/i).first().click().catch(() => {});
    await s2.getByText(/^form$/i).first().click().catch(() => {});
    await byText(s2, FORM).click();
    await saveAction(page);
  }],
  ['Action: If/Else guard (tag lead-intake-sent)', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'If/Else');
    const s = await scope(page, x => x.getByText(/segments|branch name/i));
    await byText(s, 'Add condition').click().catch(() => {});
    await s.getByText(/select condition|contact details/i).first().click().catch(() => {});
    await s.getByText(/^tags$/i).first().click();
    await s.getByText(/^includes$/i).first().click().catch(() => {});
    await s.getByRole('textbox').last().fill('lead-intake-sent');
    await s.getByText('lead-intake-sent').first().click().catch(() => {});
    await saveAction(page);
  }],
  ['Action: Add Tag new-lead', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'Add Tag');
    const s = await scope(page, x => x.getByText(/select tags|tags/i));
    await s.getByRole('textbox').last().fill('new-lead');
    await s.getByText('new-lead').first().click();
    await saveAction(page);
  }],
  ['Action: Create/Update Opportunity', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'Create Or Update Opportunity');
    const s = await scope(page, x => x.getByText(/pipeline/i));
    await s.getByText(/select pipeline/i).first().click();
    await s.getByRole('option').first().click();            // review the screenshot: pick your lead pipeline
    await s.getByText(/select stage/i).first().click();
    await s.getByRole('option', { name: PIPELINE_STAGE }).click();
    await saveAction(page);
  }],
  ['Action: Send Email', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'Send Email');
    const s = await scope(page, x => x.getByLabel(/subject/i));
    await s.getByLabel(/subject/i).fill(EMAIL_SUBJECT);
    await s.getByRole('textbox', { name: /body|message/i }).first().fill(EMAIL_BODY).catch(async () => {
      await s.frameLocator('iframe').first().locator('body').fill(EMAIL_BODY);
    });
    await saveAction(page);
  }],
  ['Action: Wait 5 minutes', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'Wait');
    const s = await scope(page, x => x.getByText(/wait for|time delay|amount/i));
    await s.getByRole('spinbutton').first().fill('5');
    await s.getByText(/minutes/i).first().click().catch(() => {});
    await saveAction(page);
  }],
  ['Action: Send SMS', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'Send SMS');
    const s = await scope(page, x => x.getByRole('textbox'));
    await s.getByRole('textbox').first().fill(SMS_BODY);
    await saveAction(page);
  }],
  ['Action: Add Tag lead-intake-sent', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'Add Tag');
    const s = await scope(page, x => x.getByText(/select tags|tags/i));
    await s.getByRole('textbox').last().fill('lead-intake-sent');
    await s.getByText('lead-intake-sent').first().click();
    await saveAction(page);
  }],
  ['Action: Internal Notification', async page => {
    await addActionPlus(page);
    await openDrawerAndPick(page, 'Internal Notification');
    const s = await scope(page, x => x.getByLabel(/subject/i));
    await s.getByLabel(/subject/i).fill(NOTIFY_SUBJECT);
    await saveAction(page);
  }],
  ['Save draft (NOT publish)', async page => {
    const s = await scope(page, x => x.getByRole('button', { name: /^save$/i }));
    await s.getByRole('button', { name: /^save$/i }).first().click();
    log('left as Draft', page.url(), 'publish toggle not touched');
  }],
];

(async () => {
  const { browser, page } = await openSession();
  console.log(`Building "${NAME}" as DRAFT. Nothing is published. Messages only send if the workflow is published.`);
  try {
    for (let i = 0; i < steps.length; i++) {
      const n = i + 1;
      if (ONLY ? n !== ONLY : n < FROM) continue;
      const [title, fn] = steps[i];
      log(`START step ${n}: ${title}`, page.url(), '-');
      await fn(page);
      await page.waitForTimeout(800);
      await shot(page, `step${n}`);
      log(`DONE step ${n}: ${title}`, page.url(), 'ok');
      if (PAUSE) await ask('Review the screenshot. Press Enter to continue, Ctrl+C to stop. ');
    }
    console.log('\nDone. Workflow is in Draft. Review the screenshots before publishing.');
  } catch (e) {
    await shot(page, 'FAILED').catch(() => {});
    log('STOPPED', page.url(), e.message.split('\n')[0]);
    console.log('\nStopped. Fix by hand if needed, then resume: node 03-build-lead-intake.js --from <step>');
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
