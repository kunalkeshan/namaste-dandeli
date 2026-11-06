/**
 * Every fact still waiting on Irshad.
 *
 * Reads the snapshot the build writes, rather than spinning up a Vite
 * SSR server to load the adapter. One source of truth, no network, and
 * it describes exactly what the last build saw.
 */
import { readFileSync } from 'node:fs';

const SNAPSHOT = '.astro/content-snapshot.json';

let c;
try {
  c = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
} catch {
  console.error(`${SNAPSHOT} is missing. Run \`pnpm build\` first.`);
  process.exit(1);
}

const out = [];
const add = (field, f) => {
  if (f && f.confirmed === false) out.push({ field, blocker: f.blocker });
};

add('site.hours', c.site?.hours);
add('site.whatsapp', c.site?.whatsapp);
(c.routes ?? []).forEach((r, i) => add(`routes[${i}] ${r.from}`, r.distance));
(c.assurances ?? []).forEach((a, i) => add(`assurances[${i}]`, a));

if (out.length === 0) {
  console.log('\nNo outstanding blockers — every fact is confirmed.\n');
  process.exit(0);
}

console.log(`\nLaunch blockers — ${out.length} question(s) for Irshad\n`);
const width = Math.max(...out.map((o) => o.field.length));
for (const o of out) {
  console.log(`  ${o.field.padEnd(width)}  ${o.blocker}`);
}
console.log(
  '\nConfirm these in the Studio: tick "Confirmed by Irshad" and record the date.\n',
);
