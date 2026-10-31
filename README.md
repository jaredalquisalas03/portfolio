# Portfolio website

Plain HTML/CSS/JS. No build step. Works on desktop, tablet and mobile.

## Put it online with GitHub Pages
1. Create a GitHub repository. Name it `USERNAME.github.io` for the URL `https://USERNAME.github.io/`, or any other name for `https://USERNAME.github.io/REPO-NAME/`.
2. Upload these files (Add file > Upload files), or use git:
   ```
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```
3. In the repo go to **Settings > Pages**. Under **Build and deployment** set **Source** to **Deploy from a branch**, pick **main** and **/ (root)**, then Save.
4. Wait 1-2 minutes, then open the URL shown on that page.
5. Optional: add a custom domain in the same settings.

## Edit your content
- Search every file for text in `[square brackets]` and replace it. Also replace `your-email@example.com` and `USERNAME`.
- `index.html` home, `about.html` bio/experience, `services.html` services, `projects.html` all projects, `contact.html` contact links.
- Project cards are repeated blocks: copy one `<article class="card">...</article>`, edit it, paste it. Set `data-cat` to match a filter button's `data-filter`.
- Images: put files in `assets/img/` and change the `src`. Keep file names lowercase (GitHub is case-sensitive).
- Resume: add `assets/resume.pdf`.
- Colors: change the variables at the top of `css/styles.css`.
