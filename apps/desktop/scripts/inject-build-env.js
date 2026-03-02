/**
 * Injects build-time env (e.g. WEB_APP_URL) into dist/build-env.json so the
 * packaged app uses the production URL when run on user machines.
 * Run after `tsc`; only writes when WEB_APP_URL is set.
 */
const fs = require('fs');
const path = require('path');

const url = process.env.WEB_APP_URL;
if (!url || typeof url !== 'string' || !url.startsWith('http')) {
  process.exit(0);
}

const distDir = path.join(__dirname, '..', 'dist');
const outPath = path.join(distDir, 'build-env.json');
if (!fs.existsSync(distDir)) {
  console.warn('apps/desktop/scripts/inject-build-env.js: dist/ not found, skipping');
  process.exit(0);
}

fs.writeFileSync(outPath, JSON.stringify({ WEB_APP_URL: url.trim() }, null, 0));
console.log('Injected WEB_APP_URL into dist/build-env.json');
