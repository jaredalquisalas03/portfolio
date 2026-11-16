# GHL automation (Playwright)

Drives the GoHighLevel web UI to build **draft** workflows in one sub-account.
Run it on your own computer. A cloud session has no screen for you to sign in.

## Setup (once)
```bash
cd ghl-automation
setup-windows.cmd      # Windows: installs Node, Playwright, Chromium (or: npm run setup)
cp .env.example .env   # set GHL_LOCATION_ID and GHL_EXPECTED_ACCOUNT
npm run login          # Chrome opens. YOU sign in + 2FA, then press Enter
```
`ghl-session.json`, `.env`, `screenshots/` and `logs/` are git-ignored. Never commit them.

## Run
| Command | What it does | Changes data? |
|---|---|---|
| `npm run check` | Dashboard screenshot, account-name check, list workflows | No |
| `node --env-file=.env 02-build-workflow.js specs/wp-01-lead-intake.json --dry-run` | Prints the build plan | No |
| `HEADLESS=0 npm run build -- --step` | Builds the workflow, pauses after each step | Creates a Draft only |

## Safety built in
- Stops if the login page shows. It never types a password.
- Stops if the expected account name is not on screen.
- Stops if a workflow with the same name exists.
- `safeClick` refuses Publish, Send, Test workflow, Delete, Charge.
- Retries once on timeout. No endless loops.
- Every step goes to `logs/run-*.jsonl` (what, where, result). Screenshots after each step.

## Known limits
- GHL changes its UI often. Locators are text/role based, but calibrate on the first run with `--step`.
- If/Else branches are marked MANUAL. The script pauses so you build that node by hand.
- Fill the `REPLACE_WITH_*` values in the spec first. The script refuses to run with them.
