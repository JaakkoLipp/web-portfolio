// Fails when the homepage HTML+CSS+JS goes over budget. Fonts are not counted.
// Run after `npm run build`. See docs/design-defaults.md, section 7.
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BUDGET = 100 * 1024;
const dist = new URL('../dist/', import.meta.url).pathname;
const html = readFileSync(join(dist, 'index.html'), 'utf8');

const assets = new Set();
for (const m of html.matchAll(/<(?:link|script)\b[^>]*\b(?:href|src)="(\/[^"]+\.(?:css|js))"/g)) assets.add(m[1]);

const rows = [['index.html', Buffer.byteLength(html)]];
for (const a of assets) rows.push([a, statSync(join(dist, a)).size]);
const total = rows.reduce((n, [, b]) => n + b, 0);

for (const [name, bytes] of rows) console.log(`${(bytes / 1024).toFixed(1).padStart(7)} KB  ${name}`);
console.log(`${(total / 1024).toFixed(1).padStart(7)} KB  total (budget ${BUDGET / 1024} KB, fonts excluded)`);
if (total > BUDGET) {
  console.error('Homepage is over budget.');
  process.exit(1);
}
