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

## Languages (i18n)

English is the default language and lives at the site root, exactly as before. Every
other language is a top-level folder named by its language code, plus a dictionary:

```
i18n/en.json            strings for the shared shell (nav, footer, JS messages) — required
i18n/uk.json            same keys in Ukrainian; anything missing falls back to English
uk/index.html           → /uk/            (translation of index.html)
uk/about/index.html     → /uk/about/      (translation of about/index.html)
uk/404.html             → /uk/404.html    (served by .htaccess for missing /uk/ URLs)
```

A page exists in a language only if its file exists — nothing is auto-translated, and a
page you have not translated yet simply has no URL in that language. Translated pages
are full HTML files (own `<title>`, meta description, Open Graph, JSON-LD), so each
language is fully controllable for SEO.

### What the build does per page

| In the page or partial | Becomes |
|---|---|
| `<!-- @hreflang -->` (put it right after `<link rel="canonical">`) | One `<link rel="alternate" hreflang>` per language the page exists in, plus `x-default` → English. |
| `{{t:footer.subscribe}}` | The string from `i18n/<lang>.json` (falls back to `en.json`, with a build warning). |
| `{{link:/about/#team}}` | `/uk/about/#team` on a Ukrainian page **if `uk/about/index.html` exists**, otherwise the English URL — so links never 404. Use it for every internal link in partials and translated pages. |
| `{{alt:uk}}` | This page in Ukrainian, or the Ukrainian home page if it is not translated. |
| `{{langswitch}}` | One `<a>` per dictionary (native name + label), for the header switcher's dropdown (the current language gets `aria-current`). |
| `{{langmeta:label}}` / `{{langmeta:name}}` | The current locale's `_meta.label` / `_meta.name`, shown on the switcher button. |
| `{{lang}}`, `{{prefix}}` | `uk` and `/uk` (empty for English). |
| `</head>` on public pages | `window.I18N` is injected: the `js` section of the dictionary, the page's URL in every language, and the banner texts. The shared scripts read it through a tiny `t(key, fallback)` helper and keep their English literals as the fallback. |

`sitemap.xml` is generated into `dist/` from the pages actually built (per-language
`<xhtml:link>` alternates, `<lastmod>` from git history — hence `fetch-depth: 0` in the
deploy workflow), and `uk/404.html` is wired in `.htaccess`. hreflang, the sitemap and
IndexNow all pick up a new translation automatically; there is no list to maintain.

A visitor whose browser prefers a language the site has, but who lands on another one,
gets a small dismissible banner (`assets/js/lang.js`) offering the switch. The site never
redirects on language: crawlers index every language at its own URL, and a redirect would
hide pages from them and from people who followed a link on purpose.

### Translating a page

1. Copy the English file to the same path under the language folder, e.g.
   `services/index.html` → `uk/services/index.html`.
2. Set `<html lang="uk">`, translate the text and the `<head>` SEO (title, description,
   OG, JSON-LD); point `canonical` / `og:url` at the `/uk/` URL; set `og:locale` to `uk_UA`
   with `og:locale:alternate` `en_GB`.
3. Replace internal hrefs with `{{link:/path/}}` and keep `<!-- @hreflang -->`.
4. Preload the Cyrillic font subset instead of the Latin one
   (`/assets/fonts/montserrat-cyrillic.woff2`).
5. `npm run dev` and open `http://localhost:3000/uk/services/`.

Strings that live in JavaScript (form and newsletter messages, carousel labels, chart
labels…) are keyed under `js` in the dictionaries. When a script gains a new user-facing
string, wrap it in `t('some.key', 'English text')` and add the key to every dictionary.

Bibliotheca article cards are rendered by `assets/js/bibliotheca.js` (index) and
`assets/js/bibliotheca-preview.js` (home page). When you translate an article, add its
title and excerpt under that language in `BIBLIO_I18N` / the `i18n` field there: an entry
is what makes the card show the translated title and link to `/<lang>/bibliotheca/<slug>/`.
A slug without an entry keeps the English card and the English link, so nothing 404s.
Also add the article to the translated index's ItemList JSON-LD and noscript list.

### Adding a language

1. Create `i18n/<code>.json` from `uk.json`. `_meta` holds the switcher label, the
   language name, the Open Graph locale and the first-visit banner text.
2. Add the font subset the script needs (`@font-face` blocks in `style.css`; Latin and
   Cyrillic are already there).
3. Add a translated 404 at `<code>/404.html` and its `<If>` block in `.htaccess`.
4. Translate pages into `<code>/…` as above. The header switcher, hreflang and the
   sitemap need no further changes.

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
checkout → setup-node → npm ci → npm run build
         → setup-php 8.1 → composer install --no-dev → cp vendor dist/vendor
         → SFTP upload dist/* to IONOS
```

`vendor/` (~3,400 files, ~30 min over IONOS SFTP) is uploaded **only when `composer.lock`
changes**: the server's version is recorded in `/vendor-version.txt`, written as the last
step after a successful upload. To force a re-upload (e.g. vendor/ was deleted on the
server): GitHub → Actions → "Deploy to IONOS" → Run workflow → tick `force_vendor`.
Deploys are serialised (`concurrency`), so two quick pushes queue instead of overlapping.

`package-lock.json` and `composer.lock` are committed (required by `npm ci` and for
reproducible PHP dependencies). The build already excludes repo-only files (README,
docs, workflow, tooling, `vendor/`, composer files), so there is no manual cleanup step.

## AI coin identification

Services page → "Coin Tools" → right-hand panel. Flow:

```
browser (assets/js/coin-identify.js)
  downscale photos to ≤1568px JPEG → POST JSON {lang, obverse, reverse}
    → /identify-coin.php → Claude (official Anthropic PHP SDK, structured JSON output)
      → JSON result rendered in the panel
```

- **Pipeline** (`coin_id_run` in `includes/coin-identify.php`): (1) Claude reads the photos
  — observations and letter-by-letter legends before the attribution — and suggests
  rulers/denominations in English; (2) every OCRE/CRRO type for those people (as issuing
  authority *or* obverse portrait) is fetched from Nomisma's SPARQL endpoint
  (`https://nomisma.org/query`, cached 30 days in the PHP temp dir) and ranked locally
  against the legends and reverse design; (3) Claude sees the photos again with the top 10
  types and may only pick from their ids, so a "verified" reference always exists in the
  catalogue. If Nomisma is unreachable the result is still returned, with references marked
  unverified. Two API calls per identification.
- **Model:** `model` in `config/anthropic.php` — `claude-haiku-4-5` (default, cheapest,
  ~$0.01/coin), `claude-sonnet-5-5` or `claude-opus-5-5` (most accurate). Prompt, schema and
  the per-model request options live in `includes/coin-identify.php` (web access
  forbidden by the root `.htaccess`), shared with the comparison script below.
- **Choosing a model:** `php scripts/compare-coin-models.php [--lang=uk] obv.jpg+rev.jpg …`
  sends your own photos to every model with the production request and prints each
  answer, time and cost (needs `composer install` and an API key; spends real credit).
- **Free alternative:** the panel always offers Google Lens (via Google Images, camera
  icon) — under the button, in every result and in every error, so visitors have a
  route even when the AI is unavailable or rate-limited.
- **Dependencies:** `composer.json` / `composer.lock` (Anthropic SDK + Guzzle), installed
  by CI and uploaded as `vendor/`. The root `.htaccess` forbids web access to `vendor/`.
  Requires **PHP 8.1+** on the host (IONOS: Hosting → PHP version).
- **API key (one-time, on the server):** copy `config/anthropic.example.php` to
  `config/anthropic.php` on the server and set `apiKey` (or set the `ANTHROPIC_API_KEY`
  env var). Gitignored, never committed, and never copied into `dist/` (the build skips
  `anthropic.php`, `telegram.php` and `newsletter.php`, because the dev server serves
  `dist/` to the local network as plain files). Without it the panel shows "temporarily
  unavailable" and the PHP error log says what is missing.
- **Spend guards:** per visitor 6 identifications/hour and 20/day; site-wide `dailyLimit`
  (default 300/day) in `config/anthropic.php`; same-origin check. Counters live in the
  PHP temp dir like the contact form's rate limit.
- **Local dev:** the static dev server (`npm run dev`) does not run PHP, so the panel
  reports "temporarily unavailable" locally. To test end to end, serve `dist/` (plus
  `vendor/` and a `config/anthropic.php`) with `php -S`.
- **Strings:** labels in the page HTML per language; dynamic labels and errors under
  `aiid.*` in `i18n/*.json` (`js` section); server error messages in `identify-coin.php`.

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
