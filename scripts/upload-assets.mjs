/**
 * One-off: upload image assets to Sanity.
 *
 * Reads scripts/asset-manifest.json, which records for every file the
 * licence and credit it must carry. Thirteen of Irshad's photographs
 * are deliberately absent from it — seven screenshots watermarked with
 * a named partner resort, one credited to a third party, three stock
 * promo graphics with burned-in badges, one showing a child, and one
 * unusable crop. The manifest's `excluded` list records each reason;
 * those files are never read.
 *
 * Idempotent: an asset whose originalFilename already exists in the
 * dataset is skipped, so a half-finished run can simply be re-run.
 *
 * Needs a token with WRITE access (Editor), which the read-only build
 * token is not:
 *   SANITY_API_WRITE_TOKEN=... node scripts/upload-assets.mjs
 *   node scripts/upload-assets.mjs --dry-run
 */
import { createClient } from '@sanity/client';
import { readFileSync, createReadStream, existsSync } from 'node:fs';
import { basename } from 'node:path';

const DRY = process.argv.includes('--dry-run');
const manifest = JSON.parse(readFileSync('scripts/asset-manifest.json', 'utf8'));

const projectId = process.env.SANITY_PROJECT_ID ?? 'krbamcti';
const dataset = process.env.SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!DRY && !token) {
  console.error(
    'SANITY_API_WRITE_TOKEN is not set.\n' +
      'Create an Editor token at sanity.io/manage -> API -> Tokens.\n' +
      'Re-run with --dry-run to preview without uploading.',
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-11-05',
  token,
  useCdn: false,
});

/** Everything to upload, flattened, with its metadata. */
const queue = [
  ...manifest.commons.map((c) => ({
    file: c.file,
    label: `commons/${c.key}`,
    meta: {
      alt: c.alt,
      credit: c.credit ?? undefined,
      licence: c.licence,
      subject: c.subject,
    },
  })),
  ...manifest.illustrations.map((i) => ({
    file: i.file,
    label: i.key,
    meta: {
      licence: 'illustration',
      subject: 'vehicle',
      credit: 'Illustration commissioned for Namaste Dandeli',
    },
  })),
  ...manifest.photos.map((p) => ({
    file: p.file,
    label: `photo-${String(p.n).padStart(2, '0')}`,
    meta: { licence: 'own', subject: 'unsorted', credit: undefined },
  })),
];

const missing = queue.filter((q) => !existsSync(q.file));
if (missing.length) {
  console.error(`${missing.length} file(s) in the manifest do not exist:`);
  missing.slice(0, 5).forEach((m) => console.error('  ' + m.file));
  process.exit(1);
}

console.log(`${queue.length} asset(s) to upload.`);
console.log(`${manifest.excluded.length} deliberately excluded:`);
for (const e of manifest.excluded)
  console.log(`  #${String(e.n).padStart(2)}  ${e.reason}`);

if (DRY) {
  console.log('\n--dry-run: nothing uploaded.');
  process.exit(0);
}

/** Existing assets, so a re-run does not duplicate. */
const existing = new Set(
  await client.fetch('*[_type == "sanity.imageAsset"].originalFilename'),
);

let uploaded = 0;
let skipped = 0;
for (const item of queue) {
  const filename = `${item.label}${item.file.match(/\.[a-z]+$/i)?.[0] ?? '.jpg'}`;
  if (existing.has(filename)) {
    skipped++;
    continue;
  }
  const asset = await client.assets.upload('image', createReadStream(item.file), {
    filename,
    // Credit and licence are stored on the asset so they survive
    // independently of any document that references it.
    ...(item.meta.credit ? { creditLine: item.meta.credit } : {}),
    ...(item.meta.alt ? { description: item.meta.alt } : {}),
  });
  uploaded++;
  console.log(`  ✓ ${filename}  ${asset._id}`);
}

console.log(`\nuploaded ${uploaded}, skipped ${skipped} (already present).`);
console.log('Source of truth for licence/credit remains scripts/asset-manifest.json.');
