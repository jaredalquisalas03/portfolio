// Stage 1: READ-ONLY. Dashboard screenshot, account check, list existing workflows.
const fs = require('fs');
const { BASE, LOCATION_ID, log, shot, withRetry, openSession, assertLoggedIn, assertAccount } = require('./lib');

(async () => {
  const { browser, page } = await openSession();
  try {
    const dash = `${BASE}/v2/location/${LOCATION_ID}/dashboard`;
    await withRetry('open dashboard', () => page.goto(dash, { waitUntil: 'domcontentloaded' }));
    await assertLoggedIn(page);
    await assertAccount(page);
    await page.waitForLoadState('networkidle').catch(() => {});
    await shot(page, 'dashboard');

    const wf = `${BASE}/v2/location/${LOCATION_ID}/automation/workflows`;
    await withRetry('open workflows', () => page.goto(wf, { waitUntil: 'domcontentloaded' }));
    await assertLoggedIn(page);
    await page.getByText(/workflows/i).first().waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await shot(page, 'workflows-list');

    // Workflow list may render in the main page or inside an iframe. Try both.
    const scopes = [page, ...page.frames().filter(f => f !== page.mainFrame())];
    let names = [];
    for (const s of scopes) {
      const rows = await s.getByRole('row').allInnerTexts().catch(() => []);
      if (rows.length > 1) { names = rows.map(r => r.replace(/\s+/g, ' ').trim()).filter(Boolean); break; }
    }
    log('workflows read', page.url(), `${names.length} rows`);
    fs.writeFileSync('logs/workflows-found.json', JSON.stringify(names, null, 2));
    console.log('\nWorkflows found:');
    names.forEach(n => console.log(' -', n));
    if (!names.length) console.log(' (none read. Check the screenshot. The list may be empty or in a new layout.)');
  } catch (e) {
    log('STOPPED', 'recon', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
