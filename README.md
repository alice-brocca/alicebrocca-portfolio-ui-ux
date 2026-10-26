# Alice Brocca — Portfolio

A static site (plain HTML, CSS and JavaScript, no build step), hosted on Cloudflare Pages behind a password.

```
site/          the website (index.html, the four case studies, styles, script, assets)
functions/     the Cloudflare password check (_middleware.js)
```

## 1. Push to GitHub

1. On github.com, create a new repository. Make it **Private**, and leave it empty
   (no README, no .gitignore, no license).
2. Copy its URL (it looks like `https://github.com/YOUR-NAME/portfolio.git`).
3. In Terminal, from this folder:

   ```bash
   git remote add origin https://github.com/YOUR-NAME/portfolio.git
   git push -u origin main
   ```

   When asked for a password, GitHub needs a **personal access token**, not your
   GitHub password: github.com → Settings → Developer settings → Personal access
   tokens → Fine-grained tokens → Generate, give it access to this repository with
   **Contents: Read and write**, and paste it at the prompt. macOS remembers it.

## 2. Publish on Cloudflare Pages

1. Sign in at dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and pick this repository.
2. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: **`site`**
3. Before (or right after) the first deploy, open the project → **Settings** →
   **Variables and Secrets**, and add, for Production:
   - `SITE_USER`: the username visitors will type (for example `guest`)
   - `SITE_PASSWORD`: the password, added as a **Secret**
4. Deploy (or **Retry deployment** after adding the variables, since they only
   apply to new deploys).

Until both variables are set, the site shows "This site is not configured yet"
instead of your work, so it is never public by accident.

To change the password later, edit `SITE_PASSWORD` and redeploy.

## Updating the site

Edit files in `site/`, then:

```bash
git add -A
git commit -m "Describe the change"
git push
```

Cloudflare publishes each push automatically.

## Preview locally

```bash
ruby -run -e httpd site -p 4321
```

Then open http://localhost:4321. (The password check only runs on Cloudflare.)
