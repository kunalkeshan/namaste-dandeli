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
 * Production reads route documents from Sanity. This module mirrors
 * them for docs, validators, and re-measurement scripts.
 */
import { confirmed, type Confirmed } from './confirmed';

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

const MEASURED = '2026-11-26';
const SOURCE =
  'OSRM (router.project-osrm.org & routing.openstreetmap.de); dest: Dandeli bus stand';

const dist = (km: number, drive: string) =>
  confirmed<Distance>({ km, drive }, MEASURED, SOURCE);

export const routes: Route[] = [
  {
    from: 'Hubballi Airport (HBX)',
    to: 'Dandeli',
    distance: dist(78, '1 hr 10 min'),
    note: 'The nearest airport.',
  },
  {
    from: 'Hubballi city & station',
    to: 'Dandeli',
    distance: dist(75, '1 hr 15 min'),
  },
  {
    from: 'Alnavar Junction',
    to: 'Dandeli',
    distance: dist(33, '31 min'),
    note: 'The closest railway station.',
  },
  {
    from: 'Londa Junction',
    to: 'Dandeli',
    distance: dist(28, '34 min'),
    note: 'Best if you are coming from Goa or the Konkan coast.',
  },
  {
    from: 'Belagavi Airport (IXG)',
    to: 'Dandeli',
    distance: dist(97, '1 hr 30 min'),
  },
  {
    from: 'Dabolim Airport, Goa (GOI)',
    to: 'Dandeli',
    distance: dist(140, '2 hr 22 min'),
    note: 'Closer than Mopa, whatever the booking sites tell you.',
  },
  {
    from: 'Mopa Airport, Goa (GOX)',
    to: 'Dandeli',
    distance: dist(168, '2 hr 26 min'),
  },
  {
    from: 'Dharwad',
    to: 'Dandeli',
    distance: dist(76, '1 hr 11 min'),
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
