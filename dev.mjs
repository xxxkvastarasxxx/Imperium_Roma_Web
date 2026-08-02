/**
 * Dev server for Imperium Roma.
 *
 *   npm run dev       -> fast (unminified, unhashed) build + live-reloading server on :3000,
 *                        rebuilds and reloads the browser on any source change.
 *   npm run preview   -> full production build, then serves dist/ as-is (no watch), so you
 *                        can sanity-check the real minified/hashed output before deploying.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';
import browserSync from 'browser-sync';
import { build } from './build.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 3000;
const PREVIEW = process.argv.includes('--preview');

const IGNORED = /(^|[\\/])(dist|node_modules|\.git|\.github|\.vscode|logs)([\\/]|$)/;

const bs = browserSync.create();

async function start() {
  await build({ dev: !PREVIEW });

  bs.init({
    server: DIST,
    port: PORT,
    open: false,
    notify: false,
    ui: false,
    logPrefix: 'imperium',
  });

  if (PREVIEW) {
    console.log('\nPreview mode: serving the production build. Ctrl+C to stop.\n');
    return;
  }

  let timer = null;
  let building = false;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      if (building) return;
      building = true;
      try {
        await build({ dev: true });
        bs.reload();
      } catch (err) {
        console.error('rebuild failed:', err.message);
      } finally {
        building = false;
      }
    }, 120);
  };

  chokidar
    .watch(ROOT, { ignored: (p) => IGNORED.test(p), ignoreInitial: true })
    .on('all', rebuild);

  console.log(`\nWatching for changes… editing any source file reloads http://localhost:${PORT}\n`);
}

start().catch((err) => {
  console.error('Dev server failed:', err);
  process.exit(1);
});
