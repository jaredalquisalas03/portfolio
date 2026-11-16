// Stage 4: build ONE workflow from a JSON spec. It stays in Draft.
// Usage:
//   node 02-build-workflow.js specs/wp-01-lead-intake.json --dry-run   (print plan, no browser)
//   HEADLESS=0 node 02-build-workflow.js specs/... --step             (pause after each step)
// Never clicks Publish, Send, Test, Delete. Never enrolls contacts.
const fs = require('fs');
const readline = require('readline');
const g = require('./lib/ghl');

const specPath = process.argv[2];
const DRY = process.argv.includes('--dry-run');
const STEP = process.argv.includes('--step');
if (!specPath) throw new Error('Pass a spec file, e.g. specs/wp-01-lead-intake.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

const rx = (s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s*\/\s*/g, '\\s*/?\\s*'), 'i');

function pause(msg) {
  if (!STEP) return Promise.resolve();
  console.log(`\n>> ${msg} - press Enter to continue (Ctrl+C to stop)`);
  return new Promise((r) => readline.createInterface({ input: process.stdin }).once('line', r));
}

function planText() {
  const lines = [`Workflow: ${spec.name} (Draft, re-entry ${spec.allowReEntry ? 'on' : 'off'})`,
    `Trigger: ${spec.trigger.type} ${JSON.stringify(spec.trigger.filters || [])}`];
  spec.actions.forEach((a, i) => lines.push(
    `Action ${i + 1}: ${a.type}${a.manual ? ' [MANUAL STEP]' : ''}${a.note ? ' - ' + a.note : ''}`));
  return lines.join('\n');
}

async function fillField(page, f) {
  const field = await g.findAnywhere(page, (s) => s.getByLabel(f.label, { exact: false })
    .or(s.getByPlaceholder(rx(f.label))));
  if (f.kind === 'text') {
    await field.fill(f.value);
  } else if (f.kind === 'tag') {
    await field.click();
    await field.fill(f.value);
    await field.press('Enter');
  } else { // select / dropdown
    await field.click();
    await (await g.findAnywhere(page, (s) => s.getByRole('option', { name: rx(f.value) })
      .or(s.getByText(f.value, { exact: true })))).click();
  }
  g.log(`set "${f.label}"`, page.url(), 'ok', { note: f.value });
}

async function saveDraft(page, label) {
  await g.safeClick(page, (s) => s.getByRole('button', { name: /^save$/i }), 'save draft');
  await g.findAnywhere(page, (s) => s.getByText(/saved|success/i), { timeout: 10_000 })
    .then(() => g.log('save confirmed', page.url(), 'ok'))
    .catch(() => g.log('save confirmed', page.url(), 'warn', { note: 'no toast seen, check screenshot' }));
  await g.shot(page, `saved-${label}`);
}

// Read the open side panel back and check expected values are there.
async function verifyPanel(page, expect, label) {
  if (!expect || !expect.length) return;
  const panel = await g.findAnywhere(page, (s) => s.getByRole('dialog').or(s.locator('aside')));
  const text = await panel.innerText();
  const missing = expect.filter((e) => !text.toLowerCase().includes(e.toLowerCase()));
  g.log(`verify ${label}`, page.url(), missing.length ? 'FAIL' : 'ok',
    { note: missing.length ? `missing: ${missing.join(', ')}` : 'panel matches spec' });
  if (missing.length) throw new Error(`Verify failed for ${label}. Missing: ${missing.join(', ')}`);
}

(async () => {
  console.log(planText());
  if (DRY) return;
  if (JSON.stringify(spec).includes('REPLACE_WITH')) {
    throw new Error('Spec still has REPLACE_WITH placeholders. Fill them in first.');
  }

  const { browser, page } = await g.open();
  try {
    // 0. Right account, and no duplicate workflow name
    await g.go(page, `/v2/location/${g.LOCATION_ID}/automation/workflows`,
      (s) => s.getByRole('button', { name: /create workflow/i }), 'workflows-before');
    await g.findAnywhere(page, (s) => s.getByText(g.EXPECTED_ACCOUNT)).catch(() => {
      throw new Error(`Account "${g.EXPECTED_ACCOUNT}" not visible. Stopping.`);
    });
    const dup = await g.findAnywhere(page, (s) => s.getByText(spec.name, { exact: true }), { timeout: 4000 })
      .then(() => true).catch(() => false);
    if (dup) throw new Error(`"${spec.name}" already exists. Stopping to avoid a duplicate.`);

    // 1. Create from scratch
    await g.safeClick(page, (s) => s.getByRole('button', { name: /create workflow/i }), 'create workflow');
    await g.safeClick(page, (s) => s.getByText(/start from scratch/i), 'start from scratch');
    await g.findAnywhere(page, (s) => s.getByText(/add new trigger/i), { timeout: 45_000 });
    await g.shot(page, 'builder-open');

    // 2. Rename
    await g.safeClick(page, (s) => s.getByText(/new workflow/i), 'open name editor');
    const nameInput = await g.findAnywhere(page, (s) => s.getByRole('textbox', { name: /name/i })
      .or(s.locator('input[value^="New Workflow"]')));
    await nameInput.fill(spec.name);
    await nameInput.press('Enter');
    g.log('rename', page.url(), 'ok', { note: spec.name });
    await pause('Renamed');

    // 3. Trigger first
    await g.safeClick(page, (s) => s.getByText(/add new trigger/i), 'open trigger picker');
    const search = await g.findAnywhere(page, (s) => s.getByPlaceholder(/search/i));
    await search.fill(spec.trigger.type);
    await g.safeClick(page, (s) => s.getByText(spec.trigger.type, { exact: true }), `pick trigger ${spec.trigger.type}`);
    for (const f of spec.trigger.filters || []) {
      await g.safeClick(page, (s) => s.getByText(/add filters?/i), 'add filter').catch(() => {});
      if (f.filter) {
        // GHL filter row: pick the filter type, then its value from a dropdown.
        await g.safeClick(page, (s) => s.getByText(/select filters?/i).or(s.getByPlaceholder(/select filters?/i)), 'open filter type');
        await g.safeClick(page, (s) => s.getByRole('option', { name: rx(f.filter) }).or(s.getByText(f.filter, { exact: true })), `filter ${f.filter}`);
        await g.safeClick(page, (s) => s.getByText(/^select$/i).or(s.getByPlaceholder(/^select/i)), 'open filter value');
        const typing = await g.findAnywhere(page, (s) => s.getByPlaceholder(/search|type/i), { timeout: 3000 }).catch(() => null);
        if (typing) await typing.fill(f.value);
        await g.safeClick(page, (s) => s.getByRole('option', { name: rx(f.value) }).or(s.getByText(f.value, { exact: true })), `value ${f.value}`);
        g.log('trigger filter', page.url(), 'ok', { note: `${f.filter} = ${f.value}` });
      } else {
        await fillField(page, f);
      }
    }
    await g.shot(page, 'trigger-configured');
    await g.safeClick(page, (s) => s.getByRole('button', { name: /save trigger/i }), 'save trigger');
    await saveDraft(page, 'trigger');
    await pause('Trigger saved');

    // 4. Actions, one at a time
    for (const [i, a] of spec.actions.entries()) {
      const label = `action-${i + 1}-${a.type.replace(/\W+/g, '-').toLowerCase()}`;
      if (a.manual) {
        g.log(label, page.url(), 'MANUAL', { note: a.note || 'needs manual build' });
        console.log(`\n[MANUAL] ${a.type}: ${JSON.stringify(a.condition || {})}`);
        if (STEP) await pause(`Build "${a.type}" by hand in the window, save it`);
        continue;
      }
      // Click the last "+" on the canvas (end of the main path)
      const adds = await g.findAnywhere(page, (s) => s.getByRole('button', { name: /add action|\+/i }).last());
      await adds.click();
      const search2 = await g.findAnywhere(page, (s) => s.getByPlaceholder(/search/i));
      await search2.fill(a.type);
      await g.safeClick(page, (s) => s.getByText(rx(a.type)), `pick action ${a.type}`);
      for (const f of a.fields || []) await fillField(page, f);
      await g.shot(page, `${label}-filled`);
      await g.safeClick(page, (s) => s.getByRole('button', { name: /save action/i }), `save ${label}`);
      await saveDraft(page, label);

      // Re-open the node and read the panel back
      await g.safeClick(page, (s) => s.getByText(rx(a.type)).last(), `reopen ${label}`);
      await verifyPanel(page, a.expect, label);
      await g.shot(page, `${label}-verified`);
      await page.keyboard.press('Escape');
      await pause(`${a.type} done`);
    }

    // 5. Confirm it is still Draft. Publishing is your call after review.
    const draft = await g.findAnywhere(page, (s) => s.getByText(/^draft$/i), { timeout: 8000 })
      .then(() => true).catch(() => false);
    g.log('status check', page.url(), draft ? 'ok' : 'warn', { note: draft ? 'still Draft' : 'Draft label not found' });
    await g.shot(page, 'final');
  } catch (e) {
    await g.shot(page, 'error').catch(() => {});
    console.error('\nSTOPPED:', e.message);
    process.exitCode = 1;
  } finally {
    console.log(`\nAudit log: ${g.logFile}`);
    await browser.close();
  }
})();
