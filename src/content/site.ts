/**
 * Business facts. Every value here is VERIFIED from Irshad's Google
 * Business Profile (2026-11-04) unless marked TODO.
 *
 * When Sanity lands, this object is what the adapter returns —
 * the components never change.
 */
export const site = {
  name: 'Namaste Dandeli',
  legalName: 'Namaste Dandeli Hotel Bookings and Taxi Services',
  googleName: 'Dandeli taxi service',
  alsoKnownAs: 'Humsafar Taxi',           // several reviews use this name
  owner: 'Irshad Khan',
  ownerShort: 'Irshad',

  phone: '+919449006326',
  phoneDisplay: '+91 94490 06326',
  whatsapp: '919449006326',               // TODO: confirm same as phone
  email: 'humsafartaxi@gmail.com',

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
    reviewsUrl: 'https://search.google.com/local/reviews?placeid=ChIJS9xlA1YhvzsRhn3XMMMsNnY',
  },

  // TODO: confirm with Irshad. Reviews repeatedly say "available anytime
  // on the phone", which suggests 24/7 — a strong claim worth making
  // explicitly, but only once he confirms it.
  hours: '24 hours, every day',
  hoursConfirmed: false,

  serviceAreas: [
    'Dandeli', 'Alur', 'Haliyal', 'Ganeshgudi', 'Hubballi', 'Dharwad',
    'Belagavi', 'Alnavar', 'Londa', 'Karwar', 'Gokarna', 'Goa',
  ],
} as const;

/** Opens WhatsApp with the message already typed. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}

export const WA_DEFAULT =
  `Hello Irshad, I would like to arrange a trip in Dandeli.\n\n` +
  `Dates: \nNumber of people: \nPickup from: `;
