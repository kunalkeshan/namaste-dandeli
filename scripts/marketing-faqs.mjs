/**
 * FAQ copy for marketingPage documents.
 *
 * Review text rarely contains literal "?" sentences, so questions here are
 * the ones travellers repeat on calls and in reviews (pickup, English,
 * trust, season, fares). Answers follow the same honesty rules as the page.
 */

/** @param {string} question @param {string} answer */
export function faqItem(question, answer) {
  return {
    _type: 'faqItem',
    _key: question.replace(/\W/g, '').slice(0, 16),
    question,
    answer,
  };
}

/** @param {[string, string][]} pairs */
function pack(pairs) {
  return pairs.map(([q, a]) => faqItem(q, a));
}

/**
 * @param {import('../src/content/routes.ts').Route[]} routes
 * @param {string} fromLabel matches route.from in routes.ts
 */
export function routeFaqs(routes, fromLabel) {
  const row = routes.find((r) => r.from === fromLabel);
  const base = pack([
    [
      'Does Irshad meet trains or flights that arrive late?',
      'Yes — guests often book station and airport pickups outside daylight hours. Message him your train or flight number and time so he can plan the meet.',
    ],
    [
      'How do I get a fare quote for this transfer?',
      'WhatsApp or call with date, pickup point, drop (bus stand or stay), and passenger count. He quotes after he knows those — there is no fixed online fare.',
    ],
  ]);
  if (row?.distance?.confirmed === true && row.distance.value) {
    const { km, drive } = row.distance.value;
    base.unshift(
      faqItem(
        `How long is the drive from ${fromLabel} to Dandeli?`,
        `About ${drive} (${km} km) to Dandeli bus stand, measured on the road 26 November 2026. Your actual pickup may add a few minutes; he quotes with traffic in mind.`,
      ),
    );
  }
  return base;
}

/** @type {Record<string, [string, string][]>} keys: `section/slug` */
export const MARKETING_FAQ_PAIRS = {
  'things-to-do/hub': [
    [
      'Does Irshad only drive, or does he book activities too?',
      'Both. He drives you to rafting, safari, coracles and the sightseeing spots, and lines up operator slots with local guides. You still pay activity operators on site; he coordinates timing and transport.',
    ],
    [
      'Why does the site stress Supa Dam for rafting?',
      'The Kali rapids run on water released from Supa Dam, not on monsoon rainfall alone. That is why dates move — he checks the release before you pay rather than promising a calendar day.',
    ],
    [
      'Why are resort names not listed here?',
      'A named resort gets booked direct and he loses the introduction he made. He books types of stay (river, treehouse, family pool) through contacts he trusts — you learn the property name when he confirms availability.',
    ],
  ],
  'things-to-do/white-water-rafting': [
    [
      'Can non-swimmers join white water rafting?',
      'Yes. Commercial runs use life jackets and a trained guide in every raft. The honest limit is whether the river is actually flowing that week, not swimming ability.',
    ],
    [
      'What grade are the Dandeli rapids?',
      'Grade II and III on the usual nine-to-twelve kilometre run from Ganeshgudi — not Grade IV as some listicles claim.',
    ],
    [
      'When is rafting usually possible?',
      'Often October to June when Supa releases water, but never on a fixed calendar. He checks the dam schedule before you book and will tell you to postpone if the river is low.',
    ],
    [
      'What does Irshad handle on rafting day?',
      'He books the operator slot, drives you from stay or bus stand, and stays honest if the release is cancelled. Guests book through him so they are not guessing online.',
    ],
  ],
  'things-to-do/jungle-safari': [
    [
      'Why is pickup around 5:15 in the morning?',
      'The forest department’s 6am gate slot means collection while it is still dark. That is when deer and giant squirrels are active before heat builds.',
    ],
    [
      'Will we see a tiger or black panther?',
      'They live in Kali Tiger Reserve, but sightings are rare. Anyone who promises a tiger is selling you something — the safari is about the forest ride with a department guide, not a guarantee.',
    ],
    [
      'Who guides the safari?',
      'A forest department guide rides in the open jeep with you. Irshad books the permit and handles the drive to the gate.',
    ],
    [
      'What is the reserve called now?',
      'Kali Tiger Reserve — the official name since the Dandeli–Anshi rename. The morning track is roughly fourteen kilometres over about two hours.',
    ],
  ],
  'things-to-do/coracle-ride': [
    [
      'Is a coracle ride safe for children or grandparents?',
      'It is the gentle river option in the group. Guides pole the round bamboo boat; tell Irshad if anyone needs a hand stepping in or out.',
    ],
    [
      'How long is a coracle ride?',
      'Usually thirty to forty-five minutes on the current — quiet enough that kingfishers and marsh crocodiles sometimes show at the banks.',
    ],
    [
      'Does Irshad book the coracle operator?',
      'Yes. He lines up the slot and drives you to the river put-in from your stay.',
    ],
  ],
  'things-to-do/birdwatching': [
    [
      'Where do serious birders go near Dandeli?',
      'Ganeshgudi is the usual base. Irshad gets you there at dawn; a local trail guide leads on foot while he handles transport.',
    ],
    [
      'Which hornbills can you see here?',
      'Four hornbill species live in this landscape among around 270 recorded species. Malabar pied and Malabar grey are the ones guests ask about most — no sighting is guaranteed.',
    ],
    [
      'When is birdwatching best?',
      'November to February is peak, with cool early mornings. He schedules the drive so you are on the trail while calls and movement are easiest to follow.',
    ],
  ],
  'things-to-do/syntheri-rocks': [
    [
      'Which river carved Syntheri Rocks?',
      'The Kaneri river — not the Kali. The monolith rises about three hundred feet above the water.',
    ],
    [
      'How fit do I need to be for Syntheri?',
      'There are a few hundred steps to the base. Pack water and shoes with grip; he skips the trip in heavy monsoon when steps get slick.',
    ],
    [
      'Can Irshad combine Syntheri with other sights in one day?',
      'Often as a half day from Dandeli with the drive and entry coordination. Message him if you want this the same day as rafting or coracles.',
    ],
  ],
  'things-to-do/supa-dam-sykes-point': [
    [
      'How does Supa Dam relate to rafting?',
      'The reservoir feeds releases on the Kali below. Seeing the dam helps explain why rafting dates follow the release schedule, not rainfall alone.',
    ],
    [
      'Do you need permission for Sykes Point?',
      'Sometimes. Irshad checks access before you set out — do not assume the viewpoint is open every evening.',
    ],
    [
      'When is the best time for Sykes Point?',
      'Guests usually go for evening light over the valley. He books timing once he knows your other activities that day.',
    ],
  ],
  'routes/hub': [
    [
      'Which airport is closest to Dandeli?',
      'Hubballi Airport (HBX) — about 78 km by road to Dandeli bus stand on the measured route. Belagavi (IXG) works when that is where your flight lands.',
    ],
    [
      'Do the times on each route page include resort drop-off?',
      'Distances on this site are measured to Dandeli bus stand. Drop at a stay adds a short local leg — he quotes the full trip after you name the property he books for you.',
    ],
    [
      'Can Irshad drive multi-day trips beyond Dandeli?',
      'Yes — reviews mention Goa, Gokarna, Mysore–Ooty and coastal Karnataka. Those are planned together; there is no fixed fare until he knows dates and route.',
    ],
  ],
  'routes/hubballi-airport': [
    [
      'Will Irshad meet me inside Hubballi airport?',
      'He meets arriving passengers at HBX with your flight details. Share the flight number and landing time on WhatsApp so he is at the curb when you exit.',
    ],
  ],
  'routes/hubballi-city': [
    [
      'Can he pick up from Hubballi railway station?',
      'Yes — for guests already in Hubballi or arriving at the city station. Name the platform or hotel and he quotes from there to Dandeli.',
    ],
  ],
  'routes/alnavar-junction': [
    [
      'Is Alnavar the closest station to Dandeli?',
      'It is the nearest rail stop on the map guests use most. Families often get picked up here for a shorter run into town or to a stay.',
    ],
  ],
  'routes/londa-junction': [
    [
      'Is Londa a good stop if I am coming from Goa?',
      'Yes — it is the usual rail approach from the Konkan side. Reviewers often book Londa–Goa legs with him as well as the hop into Dandeli.',
    ],
  ],
  'routes/belagavi-airport': [
    [
      'When should I choose Belagavi airport over Hubballi?',
      'When your ticket lands at IXG. It is farther than HBX but still a measured highway run — useful when Hubballi is not on your itinerary.',
    ],
  ],
  'routes/dabolim-goa': [
    [
      'Is Dabolim closer to Dandeli than Mopa (GOX)?',
      'For most Goa arrivals, yes — the measured road time to Dandeli bus stand is about two hours twenty-two minutes from Dabolim, not the inflated “three hours” some booking sites quote.',
    ],
  ],
  'stays/hub': [
    [
      'Why does this site not name specific resorts?',
      'So guests do not bypass the person who matched them to a property. Irshad books river cottages, treehouses and family resorts through contacts; the name comes when he confirms availability.',
    ],
    [
      'Are the stay photos real properties?',
      'They illustrate the type of stay — river, forest or family pool — not one named resort. The same disclosure appears on every stay page.',
    ],
    [
      'How do I check if rooms are free for my dates?',
      'WhatsApp or call with dates, group size and budget. He quotes what is actually free, not a stale rate from a booking aggregator.',
    ],
  ],
  'stays/on-the-river': [
    [
      'Who is a river-side stay best for?',
      'Guests who want the Kali close by — shorter drives to rafting and coracle put-ins, especially when dam releases start early.',
    ],
    [
      'Does Irshad book the room or only the cab?',
      'He holds the room through his contact when you book through him, and still drives you for activities and transfers.',
    ],
    [
      'Will I learn the resort name before I pay?',
      'Yes, once he confirms availability for your dates. It is deliberately not on this public page.',
    ],
  ],
  'stays/in-the-trees': [
    [
      'What does “in the trees” mean in Dandeli?',
      'Treehouses and jungle camps set back from the road — darker evenings, hornbills at dawn, less pool noise than large family resorts.',
    ],
    [
      'Is this stay type good for the early safari?',
      'Often yes — less driving from town for the 5:15 collection on safari mornings.',
    ],
    [
      'Should I mention children or mobility needs?',
      'Yes. Steps and balcony layouts vary; tell him ages and any mobility concerns so he picks a property that fits.',
    ],
  ],
  'stays/pool-and-family': [
    [
      'When should I choose a pool and family property?',
      'When children or a large group need space, meals on site and a pool — worth stating headcount and ages up front.',
    ],
    [
      'Are meals included?',
      'It depends on the property he matches you to. He quotes what is actually on offer for your dates rather than a generic “MAP” line from a brochure.',
    ],
    [
      'Can he arrange the Toofan for a big family group?',
      'Yes — reviewers have hired the Toofan for extended family along with sedan or Ertiga legs. Mention total passengers when you message.',
    ],
  ],
};

/** @param {string} section @param {string} slug */
export function faqsFor(section, slug) {
  return pack(MARKETING_FAQ_PAIRS[`${section}/${slug}`] ?? []);
}
