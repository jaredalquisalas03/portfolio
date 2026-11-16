// Stage 2: read-only. Confirms the sub-account, then lists workflows.
// Clicks nothing that changes data.
const fs = require('fs');
const path = require('path');
const g = require('./lib/ghl');

(async () => {
  const { browser, page } = await g.open();
  try {
    // 1. Dashboard + account name check
    await g.go(page, `/v2/location/${g.LOCATION_ID}/dashboard`,
      (s) => s.getByText(/dashboard/i), 'dashboard');

    const nameLoc = await g.findAnywhere(page, (s) => s.getByText(g.EXPECTED_ACCOUNT, { exact: false }))
      .catch(() => null);
    if (!nameLoc) {
      g.log('account check', page.url(), 'BLOCKED', { note: `"${g.EXPECTED_ACCOUNT}" not visible` });
      throw new Error('Account name not found on screen. Stopping. Check the screenshot.');
    }
    g.log('account check', page.url(), 'ok', { note: g.EXPECTED_ACCOUNT });

    // 2. Automation > Workflows list
    await g.go(page, `/v2/location/${g.LOCATION_ID}/automation/workflows`,
      (s) => s.getByRole('button', { name: /create workflow/i }), 'workflows-list');

    // The list may render in the page or in an iframe. Take the scope with the most rows.
    await g.findAnywhere(page, (s) => s.getByRole('row').nth(1)).catch(() => {});
    let rows = [];
    for (const scope of [page, ...page.frames()]) {
      const r = await scope.getByRole('row').allInnerTexts().catch(() => []);
      if (r.length > rows.length) rows = r;
    }

    const list = rows.slice(1).map((r) => r.split('\n').map((c) => c.trim()).filter(Boolean));
    const out = path.join(__dirname, 'logs', 'workflows-list.json');
    fs.writeFileSync(out, JSON.stringify(list, null, 2));
    g.log('list workflows', page.url(), list.length ? 'ok' : 'warn',
      { note: `${list.length} rows saved to logs/workflows-list.json` });
    console.table(list.map((c) => ({ name: c[0], status: c.find((x) => /draft|published/i.test(x)) || '?' })));
  } catch (e) {
    await g.shot(page, 'error').catch(() => {});
    console.error('\nSTOPPED:', e.message);
    process.exitCode = 1;
  } finally {
    console.log(`\nAudit log: ${g.logFile}`);
    await browser.close();
  }
})();
