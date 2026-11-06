/**
 * THE CONTENT ADAPTER
 *
 * Components import from here and nowhere else. This file is now a
 * single GROQ query returning the same shapes the local TypeScript
 * modules returned — and not one component changed.
 *
 * That was the whole point of the async boundary: the swap was a
 * one-file job.
 *
 * What still lives in code, deliberately:
 *   - confirmed.ts  the guard itself
 *   - copy.ts       section headings and WhatsApp message templates
 *   - site.ts       whatsappLink()/telLink(), which DERIVE from data
 * Copy moves to Sanity in a later phase; moving it now would silently
 * do nothing in three components that still hardcode their strings.
 */
import { client } from './sanity';
import { toImg, type Img } from './sanity';
import { CONTENT_QUERY } from './query';
import { regionImages, irshadPhotos } from './region';
import { narrowConfirmed, narrowDistance } from './narrow';
import { whatsappLink, telLink, WA_DEFAULT, siteLinks } from './site';
import { carImageNote } from './images';
import { staysDisclosure } from './stays';
import { soloFallback } from './assurances';
import { outstation } from './routes';
import { slabs, extras, pricingNote } from './packages';
import { nav, hero, sections, waMessages } from './copy';
import type { Confirmed } from './confirmed';
import type { Vehicle } from './vehicles';
import type { Activity } from './activities';
import type { Stay } from './stays';
import type { Route } from './routes';
import type { Assurance } from './assurances';

/**
 * The resolved content, cached as a PROMISE.
 *
 * Thirteen call sites await getContent() independently. Caching the
 * promise rather than the resolved value is what collapses them into
 * one request: Astro renders concurrently, so a cache written only
 * after the first fetch RESOLVES would let every caller miss and fire
 * its own query before the first one lands.
 */
let cache: Promise<ContentShape> | null = null;

export function getContent(): Promise<ContentShape> {
  cache ??= loadContent();
  return cache;
}

/** Drops the cache. For scripts needing a second read; never a component. */
export function __resetContentCache(): void {
  cache = null;
}

/** First non-null image, as the shape components already take. */
function firstImg(photos: unknown[] | null | undefined, alt = ''): Img | null {
  for (const p of photos ?? []) {
    const i = toImg(p as never, alt);
    if (i) return i;
  }
  return null;
}

function allImgs(photos: unknown[] | null | undefined): Img[] {
  return (photos ?? []).map((p) => toImg(p as never)).filter((i): i is Img => i !== null);
}

/**
 * Writes what the build actually fetched to .astro/, so the validators
 * check the content that SHIPPED rather than re-reading a source file
 * that may no longer be what renders. .astro/ is gitignored and never
 * deployed.
 */
async function snapshot(content: unknown) {
  if (!import.meta.env.PROD) return;
  try {
    const { writeFileSync, mkdirSync } = await import('node:fs');
    mkdirSync('.astro', { recursive: true });
    writeFileSync('.astro/content-snapshot.json', JSON.stringify(content, null, 2));
  } catch {
    // Never fail a build over the snapshot; the validators will notice
    // its absence and fail loudly there instead.
  }
}

async function loadContent() {
  const [raw, images, irshad] = await Promise.all([
    client.fetch(CONTENT_QUERY),
    regionImages(),
    irshadPhotos(),
  ]);

  if (!raw?.settings) {
    throw new Error(
      'Sanity returned no siteSettings. Either the singleton is missing ' +
        '(documentId "siteSettings") or the dataset is unreachable.',
    );
  }

  const s = raw.settings;
  const site = {
    ...s,
    whatsapp: narrowConfirmed<string>(s.whatsapp, 'site.whatsapp'),
    hours: narrowConfirmed<string>(s.hours, 'site.hours'),
  };

  const vehicles: (Vehicle & { photos: Img[] })[] = (raw.vehicles ?? []).map(
    (v: never) => ({
      ...(v as object),
      photos: allImgs((v as { photos?: unknown[] }).photos),
    }),
  ) as never;

  const activities: (Activity & { photos: Img[] })[] = (raw.activities ?? []).map(
    (a: never) => ({
      ...(a as object),
      photos: allImgs((a as { photos?: unknown[] }).photos),
    }),
  ) as never;

  const stays: (Stay & { photos: Img[] })[] = (raw.stays ?? []).map((st: never) => ({
    ...(st as object),
    photos: allImgs((st as { photos?: unknown[] }).photos),
  })) as never;

  const routes: Route[] = (raw.routes ?? []).map((r: never, i: number) => {
    const row = r as { from: string; distance: unknown };
    return {
      ...(row as object),
      distance: narrowDistance(row.distance as never, `routes[${i}] ${row.from}`),
    };
  }) as never;

  interface Review {
    author: string;
    rating: number;
    date: string;
    dateLabel: string;
    text: string;
    role: string;
    pull?: string;
    featured?: boolean;
  }
  const reviews: Review[] = raw.reviews ?? [];
  const featuredReview = reviews.find((r) => r.featured) ?? reviews[0];

  const assurances: Confirmed<Assurance>[] = (raw.assurances ?? []).map(
    (a: { fact: unknown }, i: number) =>
      narrowConfirmed<Assurance>(a.fact as never, `assurances[${i}]`),
  );

  /** Credits for every rendered image. CC BY-SA requires attribution. */
  const imageCredits = [
    ...new Set(
      [...vehicles, ...activities, ...stays]
        .flatMap((d) => d.photos)
        .map((p) => p.credit)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  /**
   * Vehicle illustrations keyed by kind, replacing the old carImages
   * map. The first photo on each vehicle document is its illustration.
   */
  const carImages = Object.fromEntries(
    vehicles.map((v, i) => [
      (['sedan', 'ertiga', 'cruiser'] as const)[i] ?? `vehicle-${i}`,
      v.photos[0] ?? null,
    ]),
  ) as Record<'sedan' | 'ertiga' | 'cruiser', Img | null>;

  const content = {
    site,
    images,
    /** Photographs of Irshad himself. The trust asset. */
    irshad,
    carImages,
    ...siteLinks(site),
    vehicles,
    activities,
    stays,
    routes,
    reviews,
    featuredReview,
    assurances,
    imageCredits,
    carImageNote,
    staysDisclosure,
    soloFallback,
    outstation,
    pricing: { slabs, extras, note: pricingNote },
    copy: { nav, hero, sections, waMessages },
  };
  await snapshot(content);
  return content;
}

type ContentShape = Awaited<ReturnType<typeof loadContent>>;
export type Content = ContentShape;
export { whatsappLink, telLink, WA_DEFAULT };
export type { Img };

/**
 * Every fact still waiting on Irshad. Generated from the content, so
 * the launch checklist cannot go stale.
 */
export async function launchBlockers() {
  const c = await getContent();
  const out: { field: string; blocker: string }[] = [];
  const add = (field: string, f: Confirmed<unknown>) => {
    if (!f.confirmed) out.push({ field, blocker: f.blocker });
  };
  add('site.hours', c.site.hours);
  add('site.whatsapp', c.site.whatsapp);
  c.routes.forEach((r, i) => add(`routes[${i}] ${r.from}`, r.distance));
  c.assurances.forEach((a, i) => add(`assurances[${i}]`, a));
  return out;
}
