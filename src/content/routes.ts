/**
 * Transfers.
 *
 * ⚠️ THE NUMBERS RULE
 * A research agent fabricated drive times for this project while
 * labelling them "verified" — the Goa figure was wrong by over eighty
 * minutes. A wrong drive time on a cab site means a customer misses a
 * flight.
 *
 * So `verified` is part of the type. The UI renders a distance ONLY
 * when verified === true. Everything else shows the route without a
 * number and invites a call. This makes the honest path the default
 * and the dishonest path impossible to reach by accident.
 *
 * To verify: measure the actual road route, set the values, flip the
 * flag, and record the date.
 */
export interface Route {
  from: string;
  to: string;
  km?: number;
  drive?: string;
  verified: boolean;
  verifiedOn?: string;
  note?: string;
}

export const routes: Route[] = [
  { from: 'Hubballi Airport (HBX)',  to: 'Dandeli', verified: false, note: 'The nearest airport.' },
  { from: 'Hubballi city & station', to: 'Dandeli', verified: false },
  { from: 'Alnavar Junction',        to: 'Dandeli', verified: false, note: 'The closest railway station.' },
  { from: 'Londa Junction',          to: 'Dandeli', verified: false, note: 'Best if you are coming from Goa or the Konkan coast.' },
  { from: 'Belagavi Airport (IXG)',  to: 'Dandeli', verified: false },
  { from: 'Goa — Dabolim (GOI)',     to: 'Dandeli', verified: false, note: 'Closer than Mopa, whatever the booking sites tell you.' },
  { from: 'Goa — Mopa (GOX)',        to: 'Dandeli', verified: false },
  { from: 'Dharwad',                 to: 'Dandeli', verified: false },
];

/** Longer trips customers have actually taken — from review text. */
export const outstation: string[] = [
  'Goa', 'Gokarna', 'Karwar', 'Jog Falls', 'Sirsi',
  'Murudeshwar', 'Udupi', 'Mangalore', 'Mysore', 'Ooty', 'Bengaluru',
];
