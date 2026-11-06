/**
 * Section prose — headings, ledes, eyebrows, nav labels.
 *
 * This used to live hardcoded across the .astro components, which
 * made the README's claim that "content/ is the ONLY place facts
 * live" true of data but not of copy — and made the planned Sanity
 * swap aspirational, since it would still have meant editing every
 * component.
 *
 * Facts belong in their own modules (site, reviews, routes...).
 * This file holds only the words around them.
 */

export const nav = {
  /**
   * Root-relative, not bare fragments.
   *
   * These were `#solo`, `#cars`, ... which resolve against the CURRENT
   * document — correct on the homepage and dead on /legal/terms-and-
   * conditions, where `#solo` means "an element on the terms page".
   * The leading `/` makes each one a navigation back to the homepage's
   * section, and it still behaves as a same-document scroll ON the
   * homepage, because `/` is the homepage's own URL under
   * trailingSlash: 'never'.
   */
  links: [
    { href: '/#solo', label: 'Travelling alone' },
    { href: '/#cars', label: 'The cars' },
    { href: '/#dandeli', label: 'Things to do' },
    { href: '/#getting-here', label: 'Routes' },
    { href: '/#stay', label: 'Stays' },
    { href: '/#reviews', label: 'Reviews' },
  ],
  call: 'Call',
  book: 'Book',
  menuOpen: 'Open menu',
} as const;

export const hero = {
  wordmark: 'Namaste Dandeli',
  place: 'Alur · Dandeli · Karnataka',
  headline: ['One person who knows', 'the whole of Dandeli'],
  lede:
    'Irshad has been driving this forest for years — to the rafting point at ' +
    'Ganeshgudi, through the tiger reserve at first light, and to the resort ' +
    'that actually suits your group. One call arranges the car, the activity ' +
    'and the stay.',
  whatsappCta: 'Message Irshad on WhatsApp',
} as const;

export const sections = {
  cars: {
    eyebrow: 'The cars',
    title: 'Three vehicles, so you are not paying for seats you do not need',
  },
  activities: {
    eyebrow: 'What you came for',
    title: 'The river, the forest, and the birds',
    lede:
      'Most of it sits twenty to forty minutes out of town, down roads that ' +
      'are easier with someone who drives them every week.',
  },
  routes: {
    eyebrow: 'Getting there and back',
    title: 'Anywhere you need to be, worked out on the phone',
    lede:
      'These are the arrivals people book most often. But the trip is whatever ' +
      'you and Irshad plan together — a single airport run, a week of driving, ' +
      'or a route nobody has asked for before.',
    outstationTitle: 'Places he has already driven people',
    outstationNote:
      'Every one of these comes out of his reviews — real trips, not a brochure list.',
    cta: 'Plan a trip with Irshad',
  },
  stays: {
    eyebrow: "Where you'll stay",
    title: 'Irshad books the room as well as the car',
    lede:
      'He works with resorts, jungle camps and homestays across Dandeli. Tell ' +
      'him the dates, the group and the budget, and he will tell you what is ' +
      'actually free — not what is advertised.',
    cta: 'Ask what is free on your dates',
  },
  pricing: {
    eyebrow: 'What it costs',
    title: 'A local day, priced the way he actually quotes it',
    cta: 'Call for a quote on your route',
  },
  reviews: {
    eyebrow: 'What people say',
    lede:
      'Every one of these is on Google under his listing, and he has replied ' +
      'to all of them for three years running.',
  },
  solo: {
    eyebrow: 'Travelling alone',
    cta: 'Ask before you book',
  },
  contact: {
    eyebrow: 'Ask Irshad',
    title: 'Tell him the dates and he will tell you what is possible',
    lede:
      'Not sure whether the rafting is running, or which resort suits a family ' +
      'with small children? That is the conversation — ask before you commit ' +
      'to anything.',
    addressTitle: 'Where he is based',
    hoursLabel: 'Hours',
    servingLabel: 'Serving',
    creditsLabel: 'Photograph credits',
  },
} as const;

/** Prefilled WhatsApp messages, one per entry point. */
export const waMessages = {
  default:
    'Hello Irshad, I would like to arrange a trip in Dandeli.\n\n' +
    'Dates: \nNumber of people: \nPickup from: ',
  stay:
    'Hello Irshad, I need a place to stay in Dandeli.\n\n' +
    'Dates: \nNumber of people: \nBudget per night: ',
  trip:
    'Hello Irshad, I would like to plan a trip.\n\n' +
    'From: \nTo: \nDates: \nNumber of people: ',
  solo:
    'Hello Irshad, I am travelling on my own and would like to ask a few ' +
    'questions before booking.',
} as const;
