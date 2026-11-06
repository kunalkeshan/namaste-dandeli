/**
 * One-off: upload image assets to Sanity.
 *
 * Uses the Sanity CLI, which authenticates with the session that
 * `sanity login` already created — so NO API token is required. An
 * Editor token would also work, but asking a human to mint one when
 * their existing login is sufficient is needless friction.
 *
 * Reads scripts/asset-manifest.json, which records for every file its
 * licence, credit, group and alt text. Thirteen of Irshad's
 * photographs are deliberately absent — seven screenshots watermarked
 * with a named partner resort, one credited to a third party, three
 * stock promo graphics with burned-in badges, one showing a child,
 * and one unusable crop. Each reason is recorded under `excluded`;
 * those files are never read.
 *
 * Idempotent: assets already present (matched on originalFilename)
 * are skipped, so a half-finished run can simply be re-run.
 *
 *   node scripts/upload-assets.mjs --dry-run
 *   node scripts/upload-assets.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';

const DRY = process.argv.includes('--dry-run');
const MANIFEST = 'scripts/asset-manifest.json';
const CLI = 'studio/node_modules/.bin/sanity';
const PROJECT = process.env.SANITY_PROJECT_ID ?? 'krbamcti';
const DATASET = process.env.SANITY_DATASET ?? 'production';

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));

/** Everything to upload, flattened and given a stable filename. */
const queue = [
  ...manifest.commons.map((c) => ({
    file: c.file,
    filename: `commons-${c.key}.jpg`,
    meta: {
      alt: c.alt,
      credit: c.credit,
      licence: c.licence,
      subject: 'region',
      group: 'region',
      slot: c.key,
    },
  })),
  ...manifest.illustrations.map((i) => ({
    file: i.file,
    filename: `${i.key}.png`,
    meta: {
      alt: `Illustration of Irshad standing beside the ${i.key.replace('vehicle-', '')}`,
      credit: 'Illustration commissioned for Namaste Dandeli',
      licence: 'illustration',
      subject: 'vehicle',
      group: 'illustration',
      slot: i.key.replace('vehicle-', ''),
    },
  })),
  ...manifest.photos.map((p) => ({
    file: p.file,
    filename: `${p.group}-${p.slot}-${String(p.n).padStart(2, '0')}${extname(p.file)}`,
    meta: {
      alt: p.alt,
      credit: undefined,
      licence: 'own',
      subject: p.subject,
      group: p.group,
      slot: p.slot,
    },
  })),
];

const missing = queue.filter((q) => !existsSync(q.file));
if (missing.length) {
  console.error(`${missing.length} manifest file(s) do not exist:`);
  missing.slice(0, 5).forEach((m) => console.error('  ' + m.file));
  process.exit(1);
}

const counts = queue.reduce(
  (a, q) => ({ ...a, [q.meta.group]: (a[q.meta.group] ?? 0) + 1 }),
  {},
);
console.log(`${queue.length} asset(s) to upload:`);
for (const [g, n] of Object.entries(counts))
  console.log(`  ${String(n).padStart(3)}  ${g}`);
console.log(`\n${manifest.excluded.length} deliberately excluded:`);
for (const e of manifest.excluded)
  console.log(`  #${String(e.n).padStart(2)}  ${e.reason}`);

if (DRY) {
  console.log('\n--dry-run: nothing uploaded.');
  process.exit(0);
}

const sanity = (args) =>
  execFileSync(CLI, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** Already-uploaded filenames, so a re-run does not duplicate. */
const existing = new Set(
  JSON.parse(
    sanity([
      'documents',
      'query',
      '*[_type == "sanity.imageAsset"].originalFilename',
      '-p',
      PROJECT,
      '-d',
      DATASET,
    ]),
  ) ?? [],
);
console.log(`\n${existing.size} asset(s) already in the dataset.`);

const uploaded = [];
let skipped = 0;
for (const item of queue) {
  if (existing.has(item.filename)) {
    skipped++;
    uploaded.push({ ...item.meta, filename: item.filename, skipped: true });
    continue;
  }
  const out = sanity([
    'assets',
    'upload',
    '--type',
    'image',
    '--file',
    item.file,
    '--filename',
    item.filename,
    '-p',
    PROJECT,
    '-d',
    DATASET,
  ]);
  const id = out.match(/"_id":\s*"([^"]+)"/)?.[1];
  if (!id) {
    console.error(`  ✗ ${item.filename} — no asset id in CLI output`);
    continue;
  }
  uploaded.push({ ...item.meta, filename: item.filename, assetId: id });
  console.log(`  ✓ ${item.filename}`);
}

// Record the asset ids so the document-seeding step can reference them
// without re-querying or guessing.
writeFileSync(
  'scripts/asset-ids.json',
  JSON.stringify(
    uploaded.filter((u) => u.assetId),
    null,
    2,
  ),
);

console.log(
  `\nuploaded ${uploaded.filter((u) => u.assetId).length}, skipped ${skipped}.`,
);
console.log('Asset ids written to scripts/asset-ids.json.');
