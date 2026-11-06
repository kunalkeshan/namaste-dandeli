import { defineQuery } from 'groq';
import { IMAGE_FIELDS } from './sanity';

/**
 * Every GROQ query, in one file.
 *
 * One query fetches everything, mirroring the all-at-once shape
 * getContent() already returned. That is both faster than nine
 * round-trips and an exact behavioural match for what components
 * already destructure.
 *
 * Note `| order(order asc)` on every list. GROQ guarantees NO order
 * without it — leave it off and the featured review, the vehicle
 * sequence and the stay sequence would each shuffle between builds.
 */
const IMG = `{ ${IMAGE_FIELDS} }`;

/** The flat object a Confirmed<T> is stored as. See narrowConfirmed. */
const FACT = `{ confirmed, value, confirmedOn, source, fallback, blocker }`;
const DISTANCE = `{ confirmed, km, drive, confirmedOn, source, fallback, blocker }`;

/**
 * A legal page. `body` is projected WHOLE — no sub-projection.
 *
 * That is the opposite of the four-field image rule, and deliberately
 * so. Portable Text is a recursive tree: blocks hold children, children
 * carry marks, and a mark resolves against its block's own `markDefs`.
 * A sub-projection that forgot `markDefs` would compile, render, and
 * silently drop every link's href — the same class of invisible bug as
 * a missing `hotspot`, with no runtime signal at all. Selecting the
 * whole value cannot be partially wrong.
 */
const LEGAL = `{
  title,
  "slug": slug.current,
  description,
  effectiveDate,
  body
}`;

export const CONTENT_QUERY = defineQuery(`{
  "settings": *[_id == "siteSettings"][0]{
    name, legalName, googleName, alsoKnownAs, owner, ownerShort,
    phone, phoneDisplay, email,
    whatsapp ${FACT},
    hours ${FACT},
    address, serviceAreas, google,
    seo
  },
  "vehicles": *[_type == "vehicle"] | order(order asc){
    name, seats, suits, note, "photos": photos[] ${IMG}
  },
  "activities": *[_type == "activity"] | order(order asc){
    name, blurb, duration, season, caveat, "photos": photos[] ${IMG}
  },
  "stays": *[_type == "stay"] | order(order asc){
    kind, blurb, "photos": photos[] ${IMG}
  },
  "routes": *[_type == "route"] | order(order asc){
    from, to, note, distance ${DISTANCE}
  },
  "reviews": *[_type == "review"] | order(order asc){
    author, rating, date, dateLabel, text, role, pull, featured
  },
  "assurances": *[_type == "assurance"] | order(order asc){
    fact ${FACT}
  },
  // ORDER COMES FROM THE ARRAY, not from a sort. Note the absence of
  // "| order(...)" -- the one place in this file where leaving it off is
  // correct. Every other list is a type filter, which GROQ gives no
  // order. This is a dereference of an ordered array, and order
  // survives the arrow. The editor's drag-and-drop in the Studio IS
  // the footer order, so a sort here would silently override it.
  // Dereferenced rather than queried by type for the same reason: a
  // page that exists but is not listed is intentionally not in the
  // footer, and a type-wide query would surface it anyway.
  "legalPages": *[_id == "siteSettings"][0].legalPages[]->${LEGAL}
}`);
