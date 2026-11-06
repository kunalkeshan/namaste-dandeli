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
  }
}`);
