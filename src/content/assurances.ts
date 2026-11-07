/**
 * The "travelling alone" assurances.
 *
 * ⚠️ These are promises made on Irshad's behalf to solo travellers —
 * the highest-risk claims on the site. If he does not actually send
 * the vehicle number before pickup, a woman travelling alone has
 * relied on something we invented.
 *
 * They lived hardcoded in SoloTravel.astro, outside every guard.
 * Each is now a `Confirmed<Assurance>`: unconfirmed ones are OMITTED
 * from the page entirely rather than shown with a fallback, because
 * a hedged safety promise is worse than none.
 *
 * Anything here that stays unconfirmed is a launch blocker.
 */
import { unconfirmed, type Confirmed } from './confirmed';

export interface Assurance {
  title: string;
  body: string;
}

export const assurances: Confirmed<Assurance>[] = [
  unconfirmed<Assurance>(
    '',
    'Do YOU always drive, or do other drivers take some trips? Reviews name Vinayak, Manoj, Mahantesh, Waseem and Anna as well as you.',
  ),
  unconfirmed<Assurance>(
    '',
    'Do you send the vehicle number and your number before pickup, so a passenger can forward them to family?',
  ),
  unconfirmed<Assurance>(
    '',
    'Is one number answered at all hours, or should the page say something softer about reachability?',
  ),
];

/**
 * What the section says while the assurances are unconfirmed. This is
 * all evidence we can stand behind today: it comes from his public
 * Google listing and his reviews, not from claims about his process.
 */
export const soloFallback = {
  title: 'Booking a stranger to drive you through a forest is a real decision',
  lede:
    'Especially alone, and especially as a woman. Irshad cannot remove that ' +
    'calculation, but he can be the kind of operator it is easy to check on: ' +
    'a named person, a listed number, and three years of reviews anyone can read.',
  /** Verifiable without asking him anything. */
  evidence: [
    {
      title: 'A named person, not an app',
      body:
        'Irshad Khan, listed at Alur on Google with the same number for years. ' +
        'Customers name him personally in around forty of his reviews.',
    },
    {
      title: 'Reviews you can read before you call',
      body:
        'All of them are public on his Google listing, including the ones from ' +
        'solo travellers. He has replied to every one.',
    },
  ],
};
