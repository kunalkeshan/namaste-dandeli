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
import { confirmed, type Confirmed } from './confirmed';

const CONFIRMED_ON = '2026-11-26';
const IRSHAD = 'Irshad Khan';
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

  whatsapp: confirmed('919449006326', CONFIRMED_ON, IRSHAD),

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

  /** Not 24/7 — confirmed wording for the contact block. */
  hours: confirmed(
    'Call to check availability. He answers early and late',
    CONFIRMED_ON,
    IRSHAD,
  ),

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
