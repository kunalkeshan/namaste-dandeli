/**
 * Real Google reviews. VERBATIM — including the typos.
 *
 * Every review here was retrieved from Google and then independently
 * re-verified by a second pass that reproduced each one from source.
 * Zero fabrications.
 *
 * DO NOT "clean up" the spelling. "confortable", "Susuki", "bcos"
 * are how these customers wrote. Editing them is embellishment, and
 * an edited testimonial is a fabricated one.
 *
 * Re-pull before each site refresh — authors can edit or delete.
 */
export interface Review {
  author: string;
  rating: 5;
  date: string;          // ISO
  dateLabel: string;     // as Google shows it
  text: string;
  /** Why this one earns its place on the page. */
  role: string;
  /**
   * An optional short pull-quote for tight spaces. MUST be a
   * contiguous verbatim span of `text` — a shortened quote, never a
   * reworded one. Verified by the assertion at the end of this file.
   */
  pull?: string;
}

export const reviews: Review[] = [
  {
    author: 'Kuhu Kalode',
    rating: 5,
    date: '2025-07-25',
    dateLabel: 'a year ago',
    text: 'Had a very smooth and safe experience as a solo female traveller. Irshad bhai took me to the best place for food, when I told him I was hungry!',
    role: 'solo-safety',
  },
  {
    author: 'Iqbal Shaikh',
    rating: 5,
    date: '2024-05-23',
    dateLabel: '2 years ago',
    text: 'Extremely happy and satisfied with the service, A week Ride with Ertiga from Dandeli-Mysore-Ooty 1600KM up and down , The cab was kept clean and neat every morning before resume the journey Entire trip was simply awesome , I am really happy with the driver Irshad he is very good human, very helpful and extremely cooperative and active The sincerity and the driving skills of the driver is much appreciated.',
    role: 'long-distance',
  },
  {
    author: 'Balu Chaturvedula',
    rating: 5,
    date: '2024-07-09',
    dateLabel: '2 years ago',
    text: 'The car is very clean and in very good condition. Irshad is the one who helped us plan the trip very effectively. He is so accommodative and he is from Dandeli and knows the place inside out. We were not too sure how to spend whole day, but he filled out agenda so tight and we were so happy and tired at the end of the day.',
    role: 'local-knowledge',
    pull: 'he is from Dandeli and knows the place inside out',
  },
  {
    author: 'Johnston Jeyaraj',
    rating: 5,
    date: '2025-07-07',
    dateLabel: 'a year ago',
    text: 'Our trip was pleasant bcos of this cab service. Mr. Irshad recommended a resort and it turned out to be a very good one. Driver was kind and polite. Service was prompt and we opted for pick up from Alnavar railway station to resort in Dandeli and back to railway station. And we hired toofan vehicle for bunch of our family members.',
    role: 'stay-and-transfer',
  },
  {
    author: 'Jayachander B',
    rating: 5,
    date: '2025-04-26',
    dateLabel: 'a year ago',
    text: 'Irshad Khan is a professional cab driver with excellent local knowledge .He is so reliable and friendly natured anyone can enjoy his services. Perfectly punctual and guided us to use the time effectively to cover all sites.Susuki Ertiga is brand new and confortable thanks to good upkeep by Irshad bhai..Many thanks.',
    role: 'punctuality',
  },
];

/** The one shown beside the booking button. */
export const featuredReview = reviews[0];

/**
 * Guard: every pull-quote must appear verbatim inside its own review.
 * This runs at build time, so a reworded quote fails the build rather
 * than reaching the page.
 */
for (const r of reviews) {
  if (r.pull && !r.text.includes(r.pull)) {
    throw new Error(
      `Pull-quote for ${r.author} is not a verbatim span of the review.`,
    );
  }
}
