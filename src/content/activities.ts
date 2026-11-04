/**
 * What people come to Dandeli for.
 *
 * Every fact here survived an adversarial verification pass against
 * Karnataka Tourism and other primary sources. Claims that did NOT
 * survive are absent — notably "Grade IV rapids" (it is II–III) and
 * "300+ bird species" (~270).
 *
 * Nothing here promises a wildlife sighting.
 */
export interface Activity {
  name: string;
  blurb: string;
  duration?: string;
  season?: string;
  /** An honest caveat shown in smaller type. */
  caveat?: string;
}

export const activities: Activity[] = [
  {
    name: 'White water rafting',
    blurb:
      'Nine to twelve kilometres of the Kali through Grade II and III rapids, starting at Ganeshgudi. Non-swimmers go too — life jackets and a guide in every raft.',
    duration: '2–4 hours with the drive',
    season: 'Usually October to June',
    caveat:
      'The river runs on water released from Supa Dam, not on rainfall. I check the release before you book — I would rather tell you in advance than drive you out to a dry river.',
  },
  {
    name: 'Jungle safari',
    blurb:
      'An open jeep into Kali Tiger Reserve with a forest department guide. Two hours, roughly fourteen kilometres. Gaur, sambar, langur and Malabar giant squirrel are common.',
    duration: '2 hours, plus the early drive',
    season: 'Best in the dry months, March to May',
    caveat:
      'The morning slot is 6am, so I collect you around 5:15. Tigers, elephants and the black panther live here but are rarely seen — anyone who promises you a sighting is selling you something.',
  },
  {
    name: 'Coracle ride',
    blurb:
      'The round bamboo boat that spins on the current. Quiet enough to drift up on a basking crocodile or a kingfisher. The gentle one — good with small children and grandparents.',
    duration: '30–45 minutes',
    season: 'Most of the year',
  },
  {
    name: 'Birdwatching',
    blurb:
      'Around 270 species, including four of India\'s nine hornbills — great, Malabar pied, Malabar grey and Indian grey. Ganeshgudi is where serious birders go.',
    duration: 'Early morning, 3–4 hours',
    season: 'Peak November to February',
  },
  {
    name: 'Syntheri Rocks',
    blurb:
      'A single granite monolith about three hundred feet high, carved out by the Kaneri river. A few hundred steps down to the base, and worth every one of them.',
    duration: 'Half day',
    caveat: 'Avoid in heavy monsoon — the steps get slick.',
  },
  {
    name: 'Supa Dam & Sykes Point',
    blurb:
      'The reservoir that feeds the Kali, and a viewpoint over the valley where the river meets the Nagzari. The evening run, for the light.',
    duration: 'Half day',
    caveat: 'Sykes Point access sometimes needs permission — I check before we set out.',
  },
];
