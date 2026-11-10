# Jared's portfolio (GitHub Pages)

Plain HTML, CSS, and JS. No build step.

## Deploy
1. Upload all files to your GitHub repo (keep the folder structure).
2. Go to **Settings > Pages**. Source: **Deploy from a branch**. Branch: **main**, folder **/ (root)**. Save.
3. Open the URL shown after a minute or two.

## Replace these (yellow marks and config)
- `index.html`: About text, LinkedIn link, og image (`assets/img/og.png`), screenshots.
- `case-studies/*.html`: project type, problem, result, screenshots. Use real numbers only.
- `js/main.js`: `GHL_CALENDAR_URL`, `VIDEO_EMBED_URL`, `CHAT_ENDPOINT`.
- Add `resume.pdf` to the root. Add WebP screenshots to `assets/img/`.

## Assistant
It works now with a built-in FAQ. For AI answers:
1. Make a free Cloudflare account. Install Wrangler: `npm i -g wrangler`, then `wrangler login`.
2. In `worker/wrangler.toml`, set `ALLOWED_ORIGIN` to your GitHub Pages origin.
3. Run `cd worker && wrangler deploy`. Copy the Worker URL into `CHAT_ENDPOINT`.
4. In Cloudflare, add a rate limiting rule on the Worker. Free-tier limits change, so check pricing pages.
5. Test odd prompts before sharing the site.

## Fonts
Google Fonts load from an external request. Remove the font link to use system fonts only.
