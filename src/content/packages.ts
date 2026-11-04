/**
 * Pricing.
 *
 * Irshad gave us exactly ONE package. There is no rate card anywhere —
 * not on his old site, not on Google. So rather than invent tiers,
 * the page explains HOW his pricing works using the real numbers, and
 * sends everything else to a phone call. That is also how he actually
 * quotes.
 *
 * TODO: get his real rates for the common routes.
 */
export interface Slab {
  vehicle: string;
  hours: number;
  km: number;
  price: number;
}

export const slabs: Slab[] = [
  { vehicle: 'Sedan',  hours: 8, km: 80, price: 2500 },
  { vehicle: 'Ertiga', hours: 8, km: 80, price: 3200 },
];

export const extras = {
  perExtraKm: 15,
  perExtraHour: 100,
};

export const pricingNote =
  'A local day is priced as a slab: eight hours and eighty kilometres. ' +
  'Go past either and the extra is charged at the rate above — no ' +
  'renegotiating halfway through the trip. Airport runs, outstation and ' +
  'multi-day trips are quoted on the route, so call and ask.';
