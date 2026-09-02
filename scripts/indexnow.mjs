/**
 * IndexNow submitter — pings participating search engines when pages change.
 *
 * IndexNow is a push protocol: instead of waiting for a crawler to rediscover a
 * changed page, we tell the engine directly. Participants are Bing, Yandex,
 * Seznam, Naver and Yep — submitting to one shares with all of them. Google is
 * NOT a participant and never adopted the protocol, so this does nothing for
 * Google rankings; it exists because Bing's index is what ChatGPT's search
 * grounding reads, which is the shortest path we have into an AI assistant.
 *
 * Only pages whose rendered HTML actually changed are submitted. Re-submitting
 * unchanged URLs is what earns a 429 and, repeated, gets a host ignored — so the
 * content hash of every indexable page is kept in a state file between runs.
 *
 * Run AFTER the deploy has landed: submitting a URL that is not live yet asks the
 * crawler to fetch a 404, which is worse than not submitting at all.
 *
 * Usage:
 *   node scripts/indexnow.mjs --dry-run   show what would be submitted, send nothing
 *   node scripts/indexnow.mjs             submit changed URLs
 *   node scripts/indexnow.mjs --all       submit every indexable URL (ignore state)
 *
 * Env:
 *   INDEXNOW_KEY       overrides the key read from the root <key>.txt file
 *   INDEXNOW_STATE     overrides the state file path
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://imperiumroma.com';
const HOST = new URL(SITE).host;
const ENDPOINT = 'https://api.indexnow.org/IndexNow';
const STATE_FILE = process.env.INDEXNOW_STATE || join(ROOT, '.indexnow-state.json');

const DRY_RUN = process.argv.includes('--dry-run');
const SUBMIT_ALL = process.argv.includes('--all');

/* ------------------------------------------------------------------ the key */

function resolveKey() {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();
  // The key file lives at the web root and is what proves domain ownership; its
  // name is the key itself, so we can find it without hardcoding the value.
  const match = readdirSync(ROOT).find((f) => /^[0-9a-f]{8,128}\.txt$/i.test(f));
  if (!match) {
    throw new Error(
      'No IndexNow key found. Expected a <key>.txt at the repo root or INDEXNOW_KEY set.',
    );
  }
  const key = readFileSync(join(ROOT, match), 'utf8').trim();
  if (key !== match.replace(/\.txt$/i, '')) {
    throw new Error(`Key file ${match} must contain exactly the key that names it.`);
  }
  return key;
}

/* ------------------------------------------------------------------- pages */

function walkHtml(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walkHtml(abs, acc);
    else if (name.toLowerCase().endsWith('.html')) acc.push(abs);
  }
  return acc;
}

const toUrl = (abs) => {
  const rel = relative(DIST, abs).split(sep).join('/');
  const path = rel === 'index.html' ? '/' : '/' + rel.replace(/(^|\/)index\.html$/, '$1');
  return SITE + path;
};

/**
 * A page is submittable only if we actually want it indexed. `noindex` is the
 * authoritative signal and it lives in the page itself, so reading it here keeps
 * this in sync automatically as pages come and go — no second list to maintain.
 */
function collectPages() {
  const pages = new Map(); // url -> content hash
  for (const abs of walkHtml(DIST)) {
    const rel = relative(DIST, abs).split(sep).join('/');
    if (rel === '404.html') continue;
    const html = readFileSync(abs, 'utf8');
    if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) continue;
    pages.set(toUrl(abs), createHash('sha256').update(html).digest('hex').slice(0, 16));
  }
  return pages;
}

/* ------------------------------------------------------------------- state */

const loadState = () => {
  if (SUBMIT_ALL || !existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')).pages || {};
  } catch {
    console.warn('  ! state file unreadable — treating this as a first run');
    return {};
  }
};

/* -------------------------------------------------------------------- main */

async function main() {
  if (!existsSync(DIST)) throw new Error('dist/ not found — run `npm run build` first.');

  const key = resolveKey();
  const pages = collectPages();
  const previous = loadState();

  const changed = [...pages.entries()]
    .filter(([url, hash]) => previous[url] !== hash)
    .map(([url]) => url)
    .sort();

  const firstRun = Object.keys(previous).length === 0;
  console.log(
    `${pages.size} indexable pages, ${changed.length} to submit` +
    `${firstRun && !SUBMIT_ALL ? ' (first run — no previous state)' : ''}`,
  );

  if (!changed.length) {
    console.log('Nothing changed since the last submission.');
    return;
  }
  for (const url of changed) console.log('  ' + url);

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing was sent.');
    return;
  }

  const body = {
    host: HOST,
    key,
    keyLocation: `${SITE}/${key}.txt`,
    urlList: changed,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });

  // 200 accepted, 202 accepted but key still being validated — both are successes.
  if (res.status !== 200 && res.status !== 202) {
    const reasons = {
      400: 'Bad request — malformed payload',
      403: 'Forbidden — key file not reachable at keyLocation, or contents do not match',
      422: 'Unprocessable — URLs do not belong to this host, or key mismatch',
      429: 'Too many requests — throttled for submitting too often',
    };
    throw new Error(
      `IndexNow returned ${res.status}. ${reasons[res.status] || (await res.text())}`,
    );
  }

  console.log(`\nIndexNow accepted ${changed.length} URL(s) (HTTP ${res.status}).`);

  // Only recorded after a successful submit, so a failed run retries the same
  // URLs next time instead of silently dropping them.
  writeFileSync(
    STATE_FILE,
    JSON.stringify({ submittedAt: new Date().toISOString(), pages: Object.fromEntries(pages) }, null, 2),
  );
}

main().catch((err) => {
  console.error('IndexNow submission failed:', err.message);
  process.exit(1);
});
