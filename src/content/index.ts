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
import { site, whatsappLink, WA_DEFAULT } from './site';
import { images, ownPhotos, imageCredits } from './images';
import { reviews, featuredReview } from './reviews';
import { vehicles } from './vehicles';
import { activities } from './activities';
import { stays, staysDisclosure } from './stays';
import { routes, outstation } from './routes';
import { slabs, extras, pricingNote } from './packages';

export async function getContent() {
  return {
    site,
    images,
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
    pricing: { slabs, extras, note: pricingNote },
  };
}

export type Content = Awaited<ReturnType<typeof getContent>>;
export { whatsappLink, WA_DEFAULT };
