/**
 * One-time codemod: replace the inline <header>/<footer> blocks in the public marketing
 * pages with `<!-- @include partials/... -->` directives, so the shell lives in one place.
 *
 * Idempotent: pages already using the include are skipped. Run from the repo root:
 *   node scripts/extract-partials.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const HEADER_PAGES = [
  'index.html', 'about/index.html', 'services/index.html',
  'authenticity/index.html', 'bibliotheca/index.html', 'contact/index.html',
];

const FOOTER_PAGES = [
  ...HEADER_PAGES,
  'policies/privacy_policy/index.html',
  'policies/terms_of_use/index.html',
  'policies/delete_user_data/index.html',
];

const HEADER_RE = /^([ \t]*)<header>[\s\S]*?<\/header>/m;
const FOOTER_RE = /^([ \t]*)<footer class="site-footer"[\s\S]*?<\/footer>/m;

function apply(page, re, directive, label) {
  const abs = join(ROOT, page);
  if (!existsSync(abs)) { console.warn(`  ? missing: ${page}`); return; }
  let html = readFileSync(abs, 'utf8');
  if (html.includes(directive)) { console.log(`  = ${label} already extracted: ${page}`); return; }
  if (!re.test(html)) { console.warn(`  ! ${label} block not found: ${page}`); return; }
  html = html.replace(re, (_m, indent) => `${indent}${directive}`);
  writeFileSync(abs, html);
  console.log(`  ✓ ${label} → include: ${page}`);
}

console.log('Extracting header/footer into includes:');
for (const p of HEADER_PAGES) apply(p, HEADER_RE, '<!-- @include partials/header.html -->', 'header');
for (const p of FOOTER_PAGES) apply(p, FOOTER_RE, '<!-- @include partials/footer.html -->', 'footer');
console.log('Done.');
