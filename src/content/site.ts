/**
 * Business facts.
 *
 * Values typed `Confirmed<T>` are gated: if Irshad has not confirmed
 * them, the page shows the fallback and never the claim. See
 * ./confirmed.ts for why that guard exists.
 *
 * Plain values are verified from his Google Business Profile
 * (2026-11-04) and safe to render directly.
 */
// `confirmed()` is imported by the modules that have confirmed facts;
// everything here is still waiting on Irshad.
import { unconfirmed, type Confirmed } from './confirmed';
export const site = {
  name: 'Namaste Dandeli',
  legalName: 'Namaste Dandeli Hotel Bookings and Taxi Services',
  googleName: 'Dandeli taxi service',
  alsoKnownAs: 'Humsafar Taxi', // several reviews use this name
  owner: 'Irshad Khan',
  ownerShort: 'Irshad',

  // Verified on his Google Business Profile.
  phone: '+919449006326',
  phoneDisplay: '+91 94490 06326',
  email: 'humsafartaxi@gmail.com',

  /**
   * The WhatsApp number may differ from the listed phone — many
   * operators keep a separate business line. Until he confirms,
   * WhatsApp CTAs fall back to the verified phone number.
   */
  whatsapp: unconfirmed<string>(
    '919449006326',
    'Is WhatsApp on +91 94490 06326, or a different number?',
  ) as Confirmed<string>,

  address: {
    street: 'Haliyal - Dandeli Rd, 3No Gate',
    locality: 'Alur',
    region: 'Karnataka',
    postalCode: '581325',
    country: 'IN',
    lat: 15.2733507,
    lng: 74.6633903,
  },

  google: {
    rating: 4.9,
    reviewCount: 160,
    placeId: 'ChIJS9xlA1YhvzsRhn3XMMMsNnY',
    mapsUrl: 'https://maps.google.com/maps?cid=8518044962067545478',
    reviewsUrl:
      'https://search.google.com/local/reviews?placeid=ChIJS9xlA1YhvzsRhn3XMMMsNnY',
  },

  /**
   * Reviews repeatedly say he is "available anytime on the phone",
   * which suggests 24/7 — a strong claim, and exactly why it must
   * not be published on a guess.
   *
   * This previously rendered "24 hours, every day" on the live page
   * behind a `hoursConfirmed: false` flag that no component read.
   */
  hours: unconfirmed<string>(
    'Call to check availability. He answers early and late',
    'Are you genuinely available 24/7, or are there hours you do not drive?',
  ) as Confirmed<string>,

  serviceAreas: [
    'Dandeli',
    'Alur',
    'Haliyal',
    'Ganeshgudi',
    'Hubballi',
    'Dharwad',
    'Belagavi',
    'Alnavar',
    'Londa',
    'Karwar',
    'Gokarna',
    'Goa',
  ],
} as const;

/**
 * Link builders.
 *
 * These DERIVE from data rather than being data, so they stay in code.
 * They now take the fetched site object: the module-level `site`
 * constant is gone once content comes from Sanity, and a builder that
 * closed over it would silently use stale local values.
 *
 * WhatsApp falls back to the verified phone number while the WhatsApp
 * number is unconfirmed, so the link always works.
 */
interface LinkSite {
  phone: string;
  whatsapp: Confirmed<string>;
}

export function siteLinks(s: LinkSite) {
  return {
    whatsappLink: (message: string) =>
      `https://wa.me/${s.whatsapp.confirmed ? s.whatsapp.value : s.whatsapp.fallback}` +
      `?text=${encodeURIComponent(message)}`,
    telLink: () => `tel:${s.phone}`,
  };
}

/** Kept for the OG card and any module-scope use. */
export function whatsappLink(message: string): string {
  const n = site.whatsapp.confirmed ? site.whatsapp.value : site.whatsapp.fallback;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}

export function telLink(): string {
  return `tel:${site.phone}`;
}

export const WA_DEFAULT =
  `Hello Irshad, I would like to arrange a trip in Dandeli.\n\n` +
  `Dates: \nNumber of people: \nPickup from: `;
