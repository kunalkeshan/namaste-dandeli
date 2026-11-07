/**
 * Transfers.
 *
 * ⚠️ THE NUMBERS RULE
 * A research agent fabricated drive times for this project while
 * labelling them "verified" — the Goa figure was wrong by over eighty
 * minutes. A wrong drive time on a cab site means a customer misses a
 * flight.
 *
 * So a distance is a `Confirmed<Distance>`: unconfirmed routes have
 * no number to print, and the UI shows "Ask the fare" instead. This
 * is the same guard as `site.hours` — one mechanism, not two.
 *
 * To confirm one: measure the real road route, then replace
 * `unconfirmed(...)` with `confirmed({ km, drive }, '2026-11-05',
 * 'Google Maps')`.
 */
import { unconfirmed, type Confirmed } from './confirmed';

export interface Distance {
  km: number;
  /** Human phrasing, e.g. "1 hr 45 min". */
  drive: string;
}

export interface Route {
  from: string;
  to: string;
  distance: Confirmed<Distance>;
  note?: string;
}

const ASK = 'Ask the fare';
const NEEDS = (r: string) => `Measure the real road route for ${r}.`;

export const routes: Route[] = [
  {
    from: 'Hubballi Airport (HBX)',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Hubballi airport → Dandeli')),
    note: 'The nearest airport.',
  },
  {
    from: 'Hubballi city & station',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Hubballi city → Dandeli')),
  },
  {
    from: 'Alnavar Junction',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Alnavar Jn → Dandeli')),
    note: 'The closest railway station.',
  },
  {
    from: 'Londa Junction',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Londa Jn → Dandeli')),
    note: 'Best if you are coming from Goa or the Konkan coast.',
  },
  {
    from: 'Belagavi Airport (IXG)',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Belagavi airport → Dandeli')),
  },
  {
    from: 'Dabolim Airport, Goa (GOI)',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Dabolim → Dandeli')),
    note: 'Closer than Mopa, whatever the booking sites tell you.',
  },
  {
    from: 'Mopa Airport, Goa (GOX)',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Mopa → Dandeli')),
  },
  {
    from: 'Dharwad',
    to: 'Dandeli',
    distance: unconfirmed<Distance>(ASK, NEEDS('Dharwad → Dandeli')),
  },
];

/** Longer trips customers have actually taken — from review text. */
export const outstation: string[] = [
  'Goa',
  'Gokarna',
  'Karwar',
  'Jog Falls',
  'Sirsi',
  'Murudeshwar',
  'Udupi',
  'Mangalore',
  'Mysore',
  'Ooty',
  'Bengaluru',
];
