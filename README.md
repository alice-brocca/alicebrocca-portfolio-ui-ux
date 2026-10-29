# Alice Brocca — Portfolio

A static site (plain HTML, CSS and JavaScript, no build step), published with GitHub Pages.

```
site/                        the website (index.html, the four case studies, styles, script, assets)
.github/workflows/pages.yml  publishes site/ to GitHub Pages on every push to main
functions/                   an optional password check, used only if the site moves to Cloudflare Pages
```

## 1. Push to GitHub

1. On github.com, create a new repository. Make it **Public** (GitHub Pages needs a
   public repository on a free account) and leave it empty (no README, .gitignore or
   license).
2. In Terminal, from this folder (use your own repository URL):

   ```bash
   git remote add origin https://github.com/YOUR-NAME/REPO-NAME.git
   git push -u origin main
   ```

   When asked for a password, GitHub needs a **personal access token**, not your
   GitHub password: github.com → Settings → Developer settings → Personal access
   tokens → Fine-grained tokens → Generate. Give it access to this repository only,
   with **Contents** and **Workflows** set to **Read and write**, and paste it at the
   prompt. macOS remembers it.

## 2. Turn on GitHub Pages

In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
Then open the **Actions** tab and re-run "Publish site" (or push again).

The site appears at `https://YOUR-NAME.github.io/REPO-NAME/`, or at
`https://YOUR-NAME.github.io/` if the repository is named `YOUR-NAME.github.io`.

GitHub Pages has no password protection: anyone with the link can see the site.
The case-study pages carry `noindex` tags, which keep them out of search results.

## Updating the site

Edit files in `site/`, then:

```bash
git add -A
git commit -m "Describe the change"
git push
```

The site updates about a minute after each push.

## Preview locally

```bash
ruby -run -e httpd site -p 4321
```

Then open http://localhost:4321.
