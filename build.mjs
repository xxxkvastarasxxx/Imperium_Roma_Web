/**
 * Imperium Roma — static site build pipeline.
 *
 * Turns the hand-maintained source pages into an optimized `dist/`:
 *   1. Resolves `<!-- @include partials/x.html -->` directives (single source of truth
 *      for header/footer/etc).
 *   2. Minifies CSS (lightningcss) and JS (esbuild) and HTML (html-minifier-terser).
 *   3. Content-hashes classic CSS/JS filenames for cache-busting and rewrites references.
 *
 * ES-module JS (files using import/export, or loaded with <script type="module">) is
 * minified *in place* and never renamed, so its relative `import` specifiers keep working.
 *
 * Usage:
 *   node build.mjs           production build  -> dist/
 *   node build.mjs --dev     fast build (no minify, no hashing) used by the dev server
 */
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, cpSync,
  statSync, readdirSync, existsSync,
} from 'node:fs';
import { join, relative, dirname, extname, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { transform as esbuildTransform } from 'esbuild';
import { transform as lightningTransform } from 'lightningcss';
import { minify as minifyHtml } from 'html-minifier-terser';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');

/* ------------------------------------------------------------------ config */

// Directories never copied into dist (build-time only or repo-only).
const EXCLUDE_DIRS = new Set([
  'dist', 'node_modules', '.git', '.github', '.vscode', 'logs',
  'partials', 'scripts', 'docs',
]);

// Individual files never copied into dist.
const EXCLUDE_FILES = new Set([
  'build.mjs', 'dev.mjs', 'package.json', 'package-lock.json',
  'pnpm-lock.yaml', 'yarn.lock', '.gitignore', 'README.md',
  'DEPLOYMENT.md', 'Imperium.png', 'deploy.ps1', '.DS_Store',
]);

// The root .htaccess is currently NOT deployed (see .github/workflows/deploy.yml,
// which `rm -f .htaccess` before upload). We preserve that behaviour so production
// routing/security is untouched. Flip to `false` to start shipping it.
const EXCLUDE_ROOT_HTACCESS = true;

// Conservative HTML minification: only strips whitespace and comments. Never rewrites
// attributes or inline JS/CSS, so behaviour and JSON-LD are byte-safe.
const HTML_MIN_OPTS = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  ignoreCustomComments: [/^!/],
  keepClosingSlash: true,
  caseSensitive: true,
  minifyJS: false,
  minifyCSS: false,
  removeAttributeQuotes: false,
  html5: true,
  // App pages embed HTML inside JS template literals; best-effort instead of throwing.
  continueOnParseError: true,
};

const JS_TARGET = 'es2019';

/* ----------------------------------------------------------------- helpers */

let DEV = false;

const toWebPath = (abs) => '/' + relative(ROOT, abs).split(sep).join('/');

const fromWebPath = (webPath) => {
  const clean = webPath.replace(/[?#].*$/, '').replace(/\/{2,}/g, '/');
  return join(ROOT, clean.replace(/^\//, ''));
};

const hash8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);

const hashedWebPath = (webPath, content) => {
  const ext = extname(webPath);
  return `${webPath.slice(0, -ext.length)}.${hash8(content)}${ext}`;
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function writeDist(webPath, content) {
  const abs = join(DIST, webPath.replace(/^\//, ''));
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    const rel = relative(ROOT, abs);
    if (statSync(abs).isDirectory()) {
      if (!EXCLUDE_DIRS.has(name)) walk(abs, acc);
      continue;
    }
    if (EXCLUDE_FILES.has(name)) continue;
    if (EXCLUDE_ROOT_HTACCESS && rel === '.htaccess') continue;
    const ext = extname(name).toLowerCase();
    if (ext === '.html') acc.html.push(abs);
    else if (ext === '.css') acc.css.push(abs);
    else if (ext === '.js') acc.js.push(abs);
    else acc.other.push(abs);
  }
}

/**
 * Build the set of JS files that must NOT be renamed: anything loaded as
 * `<script type="module">`, anything containing top-level import/export, and the
 * transitive closure of their local imports.
 */
function computeModuleSet(htmlFiles, jsFiles) {
  const set = new Set();

  for (const html of htmlFiles) {
    const src = readFileSync(html, 'utf8');
    for (const [tag] of src.matchAll(/<script\b[^>]*>/gi)) {
      if (!/type\s*=\s*["']module["']/i.test(tag)) continue;
      const m = tag.match(/src\s*=\s*["']([^"']+)["']/i);
      if (!m) continue;
      const p = fromWebPath(m[1]);
      if (existsSync(p)) set.add(p);
    }
  }

  for (const js of jsFiles) {
    const s = readFileSync(js, 'utf8');
    if (/(^|\n)\s*import[\s{('"*]/.test(s) || /(^|\n)\s*export[\s{ *]/.test(s)) set.add(js);
  }

  const queue = [...set];
  const addSpec = (spec, importer) => {
    if (!spec.startsWith('.') && !spec.startsWith('/')) return; // bare/remote
    const p = spec.startsWith('/')
      ? fromWebPath(spec)
      : resolve(dirname(importer), spec.replace(/[?#].*$/, ''));
    if (existsSync(p) && !set.has(p)) { set.add(p); queue.push(p); }
  };
  while (queue.length) {
    const f = queue.pop();
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/\bimport\s+(?:[^'"]*?\sfrom\s+)?['"]([^'"]+)['"]/g)) addSpec(m[1], f);
    for (const m of s.matchAll(/\bexport\s+[^'"]*?\sfrom\s+['"]([^'"]+)['"]/g)) addSpec(m[1], f);
  }
  return set;
}

function resolveIncludes(html, fromFile, depth = 0) {
  if (depth > 10) throw new Error(`include depth exceeded in ${fromFile}`);
  return html.replace(
    /^[ \t]*<!--\s*@include\s+([^\s>]+)\s*-->[ \t]*\r?$/gm,
    (_m, incPath) => {
      const p = fromWebPath(incPath);
      if (!existsSync(p)) throw new Error(`include not found: "${incPath}" (in ${fromFile})`);
      return resolveIncludes(readFileSync(p, 'utf8'), p, depth + 1);
    },
  );
}

/* ------------------------------------------------------------------- build */

export async function build({ dev = false } = {}) {
  DEV = dev;
  const t0 = Date.now();
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  const files = { html: [], css: [], js: [], other: [] };
  walk(ROOT, files);

  const moduleSet = computeModuleSet(files.html, files.js);
  const manifest = new Map(); // original web path -> hashed web path

  // --- CSS ---------------------------------------------------------------
  for (const cssPath of files.css) {
    const src = readFileSync(cssPath);
    let out = src;
    if (!DEV) {
      try {
        out = lightningTransform({ filename: cssPath, code: src, minify: true, errorRecovery: true }).code;
      } catch (err) {
        console.warn(`  ! CSS minify failed for ${toWebPath(cssPath)} — shipping raw (${err.message})`);
        out = src;
      }
    }
    const webOrig = toWebPath(cssPath);
    const webOut = DEV ? webOrig : hashedWebPath(webOrig, out);
    writeDist(webOut, out);
    if (!DEV) manifest.set(webOrig, webOut);
  }

  // --- JS ----------------------------------------------------------------
  for (const jsPath of files.js) {
    const isModule = moduleSet.has(jsPath);
    let out = readFileSync(jsPath, 'utf8');
    if (!DEV) {
      try {
        out = (await esbuildTransform(out, {
          loader: 'js', minify: true, target: JS_TARGET, legalComments: 'none',
        })).code;
      } catch (err) {
        console.warn(`  ! JS minify failed for ${toWebPath(jsPath)} — shipping raw (${err.message})`);
        out = readFileSync(jsPath, 'utf8');
      }
    }
    const webOrig = toWebPath(jsPath);
    // Modules keep their name so import specifiers resolve; classic scripts get hashed.
    const webOut = (DEV || isModule) ? webOrig : hashedWebPath(webOrig, out);
    writeDist(webOut, out);
    if (!DEV && !isModule) manifest.set(webOrig, webOut);
  }

  // --- passthrough assets ------------------------------------------------
  for (const f of files.other) {
    const abs = join(DIST, relative(ROOT, f));
    mkdirSync(dirname(abs), { recursive: true });
    cpSync(f, abs);
  }

  // --- HTML (last: needs the asset manifest) -----------------------------
  const rewrites = [...manifest.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const htmlPath of files.html) {
    let html = resolveIncludes(readFileSync(htmlPath, 'utf8'), htmlPath);
    for (const [orig, hashed] of rewrites) {
      html = html.replace(new RegExp(escapeRe(orig) + `(?=["'?#\\s>])`, 'g'), hashed);
    }
    if (!DEV) {
      try {
        html = await minifyHtml(html, HTML_MIN_OPTS);
      } catch (err) {
        console.warn(`  ! HTML minify failed for ${toWebPath(htmlPath)} — shipping unminified (${err.message.split('\n')[0]})`);
      }
    }
    writeDist(toWebPath(htmlPath), html);
  }

  const ms = Date.now() - t0;
  console.log(
    `${DEV ? 'dev' : 'prod'} build: ${files.html.length} html, ${files.css.length} css, ` +
    `${files.js.length} js (${moduleSet.size} modules kept), ${files.other.length} assets ` +
    `→ dist/ in ${ms}ms`,
  );
  return { files, moduleSet, manifest };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  build({ dev: process.argv.includes('--dev') }).catch((err) => {
    console.error('\nBuild failed:', err);
    process.exit(1);
  });
}
