import { client, toImg, IMAGE_FIELDS, type SanityImg } from './sanity';

/**
 * The region photographs, keyed exactly as the old images.ts was.
 *
 * These are the Wikimedia files, now re-hosted on Sanity's CDN. The
 * keys are preserved so components reading `images.rafting` keep
 * working — and because the alt text and CC BY-SA credits travel with
 * each asset, the footer attribution still renders.
 */
const SLOTS = [
  'rafting',
  'hornbill',
  'coracle',
  'riverDawn',
  'syntheri',
  'sykesPoint',
  'forestRoad',
  'kaliHabitat',
] as const;

export type RegionKey = (typeof SLOTS)[number];

interface AssetRow {
  originalFilename: string;
  _id: string;
  url: string;
  description?: string;
  creditLine?: string;
  metadata?: { dimensions?: { width: number; height: number }; lqip?: string };
}

export async function regionImages() {
  const rows: AssetRow[] = await client.fetch(
    `*[_type == "sanity.imageAsset" && originalFilename match "commons-*"]{
      _id, url, originalFilename, description, creditLine, metadata
    }`,
  );
  const out = {} as Record<RegionKey, NonNullable<ReturnType<typeof toImg>>>;
  const missing: string[] = [];
  for (const slot of SLOTS) {
    const row = rows.find((r) => r.originalFilename === `commons-${slot}.jpg`);
    const img =
      row &&
      toImg(
        {
          asset: { _id: row._id, url: row.url, metadata: row.metadata },
          alt: row.description ?? '',
          credit: row.creditLine,
        } as SanityImg,
        row.description ?? '',
      );
    if (!img) {
      missing.push(slot);
      continue;
    }
    out[slot] = img;
  }
  // Fail the build rather than render a hole. A missing region image
  // means the upload did not complete, which is a red build we want to
  // see before a visitor sees a broken page.
  if (missing.length) {
    throw new Error(
      `Region image(s) missing from Sanity: ${missing.join(', ')}. ` +
        `Re-run: node scripts/upload-assets.mjs`,
    );
  }
  return out;
}

export { IMAGE_FIELDS };
