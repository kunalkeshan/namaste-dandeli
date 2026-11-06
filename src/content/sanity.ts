/**
 * The Sanity client and image URL builder.
 *
 * Deliberately NOT @sanity/astro. Its one real offering is the
 * `sanity:client` virtual module, and src/content/index.ts is already
 * the seam that module would occupy — at the cost of seven peer
 * dependencies including React, on a site that ships zero client JS.
 *
 * This runs only in Astro frontmatter, at build time. Nothing here
 * reaches the browser.
 */
import { createClient } from '@sanity/client';
// Named export: the v1 default export is deprecated in @sanity/image-url v2.
import { createImageUrlBuilder } from '@sanity/image-url';

const projectId = import.meta.env.SANITY_PROJECT_ID ?? 'krbamcti';
const dataset = import.meta.env.SANITY_DATASET ?? 'production';

export const client = createClient({
  projectId,
  dataset,
  // Pinned, never floating: a moving apiVersion means a build can
  // change behaviour without a commit.
  apiVersion: '2026-11-05',
  // Builds are infrequent and must never serve stale content, so skip
  // the CDN. The dataset is public, so no token is required.
  useCdn: false,
  // Drafts must never reach a production build.
  perspective: 'published',
});

const builder = createImageUrlBuilder({ projectId, dataset });

/**
 * THE FOUR-FIELD PROJECTION RULE.
 *
 * Every image projection must select asset->, hotspot, crop AND alt.
 * Projecting only { asset->, alt } compiles, renders, and silently
 * degrades every crop to a blind centre-crop — so an editor who
 * carefully hotspots Irshad's face gets it cropped out, with no error
 * anywhere. There is no runtime signal for this bug, which is why
 * scripts/verify-sanity.mjs checks for it statically.
 */
export const IMAGE_FIELDS = `
  "asset": asset->{ _id, url, metadata { dimensions, lqip } },
  hotspot, crop, alt, credit, licence, subject
`;

export interface SanityImg {
  asset?: {
    _id: string;
    url: string;
    metadata?: { dimensions?: { width: number; height: number }; lqip?: string };
  };
  hotspot?: { x: number; y: number };
  crop?: unknown;
  alt?: string;
  credit?: string;
  licence?: string;
  subject?: string;
}

/** Widths the responsive srcset is generated at. */
const WIDTHS = [480, 800, 1200, 1600, 2000] as const;

/**
 * Turns a Sanity image into the `Img` shape the components already
 * take, so CommonsImage.astro keeps working unchanged.
 *
 * `fit('crop')` is what makes the hotspot meaningful; `auto('format')`
 * serves AVIF/WebP where supported. Measured against the old Commons
 * hotlinks, the hero drops from 897KB to 302KB at 1600w — Commons
 * rounded every request UP to its own bucket sizes, so the srcset
 * width descriptors understated the bytes actually delivered.
 */
export function toImg(
  src: SanityImg | null | undefined,
  fallbackAlt = '',
  opts: { quality?: number } = {},
) {
  if (!src?.asset) return null;
  const dim = src.asset.metadata?.dimensions;
  /**
   * Quality is per-image on purpose. The default (~82) is right for a
   * photograph someone looks AT; the hero sits at 60% opacity behind
   * white text and is looked THROUGH, where q=55 is indistinguishable
   * and ~30% smaller. One global setting would either waste bytes on
   * the backdrop or visibly degrade the photographs.
   */
  const url = (w: number) => {
    const b = builder
      .image(src as Parameters<typeof builder.image>[0])
      .width(w)
      .auto('format')
      .fit('crop');
    return (opts.quality ? b.quality(opts.quality) : b).url();
  };
  return {
    src: url(1600),
    srcset: WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '),
    width: dim?.width ?? 1600,
    height: dim?.height ?? 1067,
    alt: src.alt ?? fallbackAlt,
    credit: src.credit,
    lqip: src.asset.metadata?.lqip,
  };
}

export type Img = NonNullable<ReturnType<typeof toImg>>;
