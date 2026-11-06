/**
 * Backfills alt text and credits onto uploaded Sanity assets.
 *
 * `sanity assets upload` accepts no metadata flags, so the alt text in
 * scripts/asset-manifest.json never reached the Content Lake — every
 * asset landed with description:null, and every image on the page
 * therefore fell back to EMPTY alt. That is an accessibility failure
 * and it is invisible without checking the API.
 *
 * The manifest stays the source of truth; this patches the dataset to
 * match it. Safe to re-run — it skips assets already correct.
 *
 *   node scripts/backfill-asset-meta.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CLI = 'studio/node_modules/.bin/sanity';
const ARGS = ['-p', 'krbamcti', '-d', 'production', '--api-version', '2026-11-05'];
const m = JSON.parse(readFileSync('scripts/asset-manifest.json', 'utf8'));

const want = new Map();
for (const c of m.commons)
  want.set(`commons-${c.key}.jpg`, { alt: c.alt, credit: c.credit });
for (const i of m.illustrations)
  want.set(`${i.key}.png`, {
    alt: `Illustration of Irshad standing beside the ${i.key.replace('vehicle-', '')}`,
    credit: 'Illustration commissioned for Namaste Dandeli',
  });
for (const p of m.photos)
  want.set(`${p.group}-${p.slot}-${String(p.n).padStart(2, '0')}.jpeg`, { alt: p.alt });

const rows = JSON.parse(
  execFileSync(
    CLI,
    [
      'documents',
      'query',
      '*[_type=="sanity.imageAsset"]{_id,originalFilename,description}',
      ...ARGS,
    ],
    { encoding: 'utf8' },
  ),
);

const patches = [];
for (const r of rows) {
  const w = want.get(r.originalFilename);
  if (!w?.alt || r.description === w.alt) continue;
  patches.push({
    patch: {
      id: r._id,
      set: {
        description: w.alt,
        altText: w.alt,
        ...(w.credit ? { creditLine: w.credit } : {}),
      },
    },
  });
}

if (!patches.length) {
  console.log('All assets already carry their alt text.');
  process.exit(0);
}

/* `dataset import` refuses to patch system documents, so go through
   the mutate endpoint. The CLI holds the auth token, so ask it for one
   rather than requiring a separate API token. */
writeFileSync('tmp-asset-meta.json', JSON.stringify({ mutations: patches }));
writeFileSync(
  'studio/.backfill-run.cjs',
  `const fs = require('node:fs');
const { createClient } = require('@sanity/client');
// SANITY_AUTH_TOKEN is injected by \`sanity exec --with-user-token\`,
// so no separate API token is needed.
const client = createClient({
  projectId: 'krbamcti',
  dataset: 'production',
  apiVersion: '2026-11-05',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
});
const { mutations } = JSON.parse(fs.readFileSync('${process.cwd()}/tmp-asset-meta.json','utf8'));
client
  .mutate(mutations.map((m) => ({ patch: m.patch })))
  .then(() => console.log('patched ' + mutations.length + ' asset(s)'))
  .catch((e) => { console.error(e.message); process.exit(1); });
`,
);
const out = execFileSync(CLI, ['exec', '--with-user-token', '.backfill-run.cjs'], {
  encoding: 'utf8',
  cwd: 'studio',
});
console.log(out.trim());
