# VA Ops Hub — AI Automation Services

Operating system for my solo AI Automation Specialist practice.
It holds the SOPs, templates, checklists, and client files I use to deliver.

**Core services:** GoHighLevel (GHL) builds, Meta Ads, email/SMS automation, booking systems.
**Outcomes I sell:** more leads, more booked calls, fewer manual hours.

## Folder map

```
va-ops-hub/
├── 00-core/          # Brand voice, client intake, pricing, SOP template
├── services/         # One folder per service
│   ├── ghl/          #   sops/ templates/ checklists/ examples/
│   ├── meta-ads/
│   ├── email-sms/
│   └── booking/
├── clients/          # One folder per client (copy _template/)
├── skills/           # Claude .skill files
└── portfolio/        # Case studies and redacted samples
```

## How to add a new service

1. Create `services/<service-name>/`.
2. Add these four folders inside it: `sops/`, `templates/`, `checklists/`, `examples/`.
3. Add a `.gitkeep` to any folder that is still empty.
4. Write the first SOP from `00-core/sop-template.md`.
5. Add the service to the folder map above.

```bash
s=new-service; for d in sops templates checklists examples; do mkdir -p services/$s/$d && touch services/$s/$d/.gitkeep; done
```

## How to add a new client

1. Copy the template: `cp -r clients/_template clients/<client-slug>`.
2. Use a short slug, e.g. `acme-dental`. No personal names.
3. Fill in `brief.md` from the intake call.
4. Save build files and reports in `deliverables/`.
5. Log calls, decisions, and changes in `notes.md`.

## Security rule — read first

**No client logins, API keys, passwords, or PII in this repo. Ever.**

- Store credentials in a password manager (e.g. Bitwarden, 1Password).
- Refer to access by name only: "GHL sub-account: see vault entry `acme-dental-ghl`".
- Redact names, emails, phone numbers, and addresses before saving samples.
- `.gitignore` blocks `.env`, `*.key`, `credentials*`, and `secrets/`. It is a backstop, not a plan.
- If a secret gets committed, rotate it immediately. Deleting the file is not enough.
