/**
 * THE CONTENT ADAPTER
 *
 * Components import from here and nowhere else. Today every value is
 * a local TypeScript module. When Sanity lands, this file becomes a
 * set of GROQ queries returning the same shapes — and not one
 * component changes.
 *
 * That is the whole point: the swap is a one-file job, which is why
 * `getContent()` is async even though nothing awaits yet. An async
 * boundary today costs nothing and saves rewriting every `.astro`
 * file later.
 */
import { site, whatsappLink, telLink, WA_DEFAULT } from './site';
import { images, carImages, carImageNote, ownPhotos, imageCredits } from './images';
import { reviews, featuredReview } from './reviews';
import { vehicles } from './vehicles';
import { activities } from './activities';
import { stays, staysDisclosure } from './stays';
import { routes, outstation } from './routes';
import { slabs, extras, pricingNote } from './packages';
import { assurances, soloFallback } from './assurances';
import { nav, hero, sections, waMessages } from './copy';
import { blockers } from './confirmed';

export async function getContent() {
  return {
    site,
    images,
    carImages,
    carImageNote,
    ownPhotos,
    imageCredits,
    reviews,
    featuredReview,
    vehicles,
    activities,
    stays,
    staysDisclosure,
    routes,
    outstation,
    assurances,
    soloFallback,
    pricing: { slabs, extras, note: pricingNote },
    copy: { nav, hero, sections, waMessages },
  };
}

export type Content = Awaited<ReturnType<typeof getContent>>;
export { whatsappLink, telLink, WA_DEFAULT };

/**
 * Every fact still waiting on Irshad. `scripts/report-blockers.mjs`
 * prints this, so the launch runbook is generated rather than
 * hand-maintained — a hand-kept list goes stale the first time
 * someone confirms a fact and forgets to tick the box.
 */
export function launchBlockers() {
  const out: { field: string; blocker: string }[] = [
    ...blockers({ 'site.hours': site.hours, 'site.whatsapp': site.whatsapp }),
    ...routes
      .map((r, i) => ({ r, i }))
      .filter(({ r }) => !r.distance.confirmed)
      .map(({ r, i }) => ({
        field: `routes[${i}] ${r.from}`,
        blocker: (r.distance as { blocker: string }).blocker,
      })),
    ...assurances
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => !a.confirmed)
      .map(({ a, i }) => ({
        field: `assurances[${i}]`,
        blocker: (a as { blocker: string }).blocker,
      })),
  ];
  if (!ownPhotos.ready) {
    out.push({
      field: 'ownPhotos',
      blocker:
        'Photos of Irshad with his car, and partner resorts with signage cropped out.',
    });
  }
  return out;
}
