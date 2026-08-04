# Development Guide

Imperium Roma is a **static multi-page site** with a small, dependency-light build
pipeline. There is **no framework** — pages stay plain HTML/CSS/JS. The build only does
three things: resolve shared HTML partials, minify, and content-hash assets for
cache-busting. Output goes to `dist/`, which is what gets deployed.

## Prerequisites

- Node.js **20+** (`node --version`)
- `npm install` once to pull the dev tooling

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Live-reloading dev server on http://localhost:3000. Rebuilds + reloads the browser on any source change. Output is **unminified and unhashed** for easy debugging. |
| `npm run build` | Production build into `dist/` — minified CSS/JS/HTML + content-hashed asset filenames. |
| `npm run preview` | Full production build, then serves `dist/` as-is (no watch) so you can check the real deployed output. |
| `npm run clean` | Delete `dist/`. |

You never edit `dist/` by hand — it is generated and git-ignored.

## Shared header / footer (HTML includes)

The navigation header and site footer live in **one place** each:

- `partials/header.html`
- `partials/footer.html`

Pages pull them in with a directive on its own line:

```html
    <!-- @include partials/header.html -->
    ...page content...
    <!-- @include partials/footer.html -->
```

At build time the directive is replaced by the partial's contents. **To change a nav link
or footer, edit the partial once** — every page updates.

Include paths are resolved from the repo root, so they are the same regardless of how deep
the page is (`/index.html` and `/policies/terms_of_use/index.html` both write
`<!-- @include partials/header.html -->`).

> The `domus/*` (logged-in "Domus") and `login/*` areas use a different app shell and do
> **not** use these public partials. If you later want to de-duplicate those, add e.g.
> `partials/domus-header.html` and include it the same way.

## Adding or editing a page

1. Create/edit the `.html` file wherever it belongs (folder = URL, per the existing
   convention: `about/index.html` → `/about/`).
2. Use `<!-- @include partials/header.html -->` / `footer.html` for the shared shell.
3. Keep page-specific `<head>` SEO (title, description, canonical, OG, JSON-LD) **in the
   page** — it is intentionally not shared.
4. Reference CSS/JS with absolute paths (`/assets/css/foo.css`). The build rewrites these
   to the hashed filenames automatically.
5. `npm run dev` and check it.

## How assets are optimized

- **CSS** — minified (lightningcss) and renamed to `name.<hash>.css`. References in HTML
  are rewritten to match. Change the file → new hash → browsers fetch the new version;
  unchanged files keep their hash and stay cached.
- **Classic JS** (plain scripts sharing globals: header, hamburger, carousel, parallax,
  newsletter, …) — minified (esbuild) and content-hashed, same as CSS.
- **ES-module JS** — files that use `import`/`export` or are loaded with
  `<script type="module">` (the Supabase/login/Domus code: `config.js`,
  `supabaseClient.js`, `login.js`, `check-profile.js`, `create-profile.js`,
  `domus.js`, `supabase-init.js`) are **minified in place and keep their original names**.
  Hashing them would break their internal `import '/assets/js/…'` specifiers. The build
  detects this set automatically (module graph), so you don't have to configure anything.
- **Everything else** (images, videos, PHP, `.htaccess` under `config/`, JSON, XML,
  fonts, PDFs, `robots.txt`, `sitemap.xml`) is copied through untouched.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`:

```
checkout → setup-node → npm ci → npm run build → SFTP upload dist/* to IONOS
```

`package-lock.json` is committed (required by `npm ci`). The build already excludes
repo-only files (README, docs, workflow, tooling), so there is no manual cleanup step.

## Notes & known items

- **Root `.htaccess` ships with every build** (HTTPS redirect, security headers, caching,
  compression, sensitive-file protection). If IONOS ever needs a different `.htaccess` to
  be authoritative instead, set `EXCLUDE_ROOT_HTACCESS = true` in `build.mjs`.
- **`subscribe.php` is tracked in git** and deploys automatically like any other file —
  it contains no secrets. Its Brevo credentials come from hosting env vars
  (`BREVO_API_KEY`, `BREVO_LIST_ID`, `ALLOWED_DOMAIN`) or a gitignored
  `config/newsletter.php` (copy `config/newsletter.example.php`), same pattern as
  `config/telegram.php` for the contact form. See
  [docs/NEWSLETTER_SETUP.md](NEWSLETTER_SETUP.md).
- **ES-module cache-busting is by name only.** Because module files keep their names, a
  changed module relies on normal HTTP caching rather than a new hash. These files (the
  logged-in app area) change rarely; hard-refresh if needed. Bundling the Domus app into
  hashed entry files is a good future step.
- **Orphaned hashed files.** SFTP upload does not delete remote files, so old hashed
  assets accumulate on the server over time. Harmless (nothing references them); can be
  cleaned periodically.
- **`domus/assets/css/domus.css`** has a Google-Fonts `@import` after other rules, which
  is invalid CSS (browsers ignore it). The build recovers and still minifies it. Move the
  `@import` to the top of the file to make the font load.

## Future optimization opportunities (not yet done)

- Replace render-blocking CDN `<script>`s (Chart.js, Three.js, jsPDF, html2canvas) with
  `defer`/`async` and Subresource Integrity, or self-host + hash them.
- Swap CSS `@import` Google Fonts for `<link rel="preconnect">` + `<link>` in `<head>`.
- Image optimization (WebP/AVIF, responsive `srcset`) — the repo is ~67 MB of media.
- Extract a shared `<head>` partial for the invariant meta/links once the SEO-specific
  parts are templated per page.
