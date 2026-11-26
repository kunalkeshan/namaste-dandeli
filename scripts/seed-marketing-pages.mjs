/**
 * Seed marketingPage documents into Sanity.
 *
 *   node scripts/seed-marketing-pages.mjs --dry-run
 *   node scripts/seed-marketing-pages.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';

const DRY = process.argv.includes('--dry-run');
const PROJECT = process.env.SANITY_PROJECT_ID ?? 'krbamcti';
const DATASET = process.env.SANITY_DATASET ?? 'production';
const OUT = 'scripts/.seed-marketing.ndjson';

const assets = JSON.parse(readFileSync('scripts/asset-ids.json', 'utf8'));
const research = JSON.parse(readFileSync('scripts/reviews-research.json', 'utf8'));

const pick = (group, slot) =>
  assets.find((a) => a.group === group && (slot === undefined || a.slot === slot));

const img = (a) =>
  a && {
    _type: 'imageWithMeta',
    _key: a.assetId.slice(6, 22),
    asset: { _type: 'reference', _ref: a.assetId },
    alt: a.alt,
    ...(a.credit ? { credit: a.credit } : {}),
    licence: a.licence,
    subject: a.subject,
  };

const findReview = (needle) =>
  research.reviews.find((r) => r.text.toLowerCase().includes(needle.toLowerCase()));

const quote = (needle, pull) => {
  const r = findReview(needle);
  if (!r) return null;
  const p = pull && r.text.includes(pull) ? pull : undefined;
  return {
    _type: 'pageQuote',
    _key: r.id.slice(0, 12),
    author: r.author,
    text: r.text,
    dateLabel: r.dateLabel,
    ...(p ? { pull: p } : {}),
  };
};

const section = (heading, body) => ({
  _type: 'pageSection',
  _key: heading?.slice(0, 12) ?? body.slice(0, 12),
  heading,
  body,
});

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});
const actMod = await server.ssrLoadModule('/src/content/activities.ts');
const stayMod = await server.ssrLoadModule('/src/content/stays.ts');
const copyMod = await server.ssrLoadModule('/src/content/copy.ts');
const activities = actMod.activities;
const stays = stayMod.stays;
const { waMessages } = copyMod;
await server.close();

const rafting = activities.find((a) => a.name.includes('rafting'));
const safari = activities.find((a) => a.name.includes('safari'));

const docs = [];

const page = (base) => ({
  _type: 'marketingPage',
  ...base,
});

docs.push(
  page({
    _id: 'marketing-things-to-do-hub',
    section: 'things-to-do',
    slug: 'hub',
    published: true,
    title: 'Adventures in Dandeli | Things to do | Namaste Dandeli',
    description:
      'Rafting on the Kali, jungle safari at first light, coracles and birds — Irshad arranges the drive and books what runs that week.',
    pageTitle: 'Adventures in Dandeli',
    eyebrow: 'Things to do',
    lede: 'Most activities sit twenty to forty minutes out of town. Irshad checks dam release before rafting, collects you around 5:15 for the morning safari, and tells you straight when something is closed.',
    sections: [
      section(
        undefined,
        'This is what people actually book through him — not a list scraped off a travel site. The river runs on Supa Dam release, not rainfall. The forest does not promise a tiger.',
      ),
    ],
    faqs: [],
    quotes: [],
    whatsappMessage:
      'Hi Irshad, we are planning activities in Dandeli.\n\nDates: \nGroup size: \nWhat we want to try: ',
    enquiryTopic: 'Dandeli activities',
    heroImage: img(pick('region', 'rafting')),
  }),
  page({
    _id: 'marketing-things-to-do-white-water-rafting',
    section: 'things-to-do',
    slug: 'white-water-rafting',
    published: true,
    title: 'White water rafting in Dandeli | Namaste Dandeli',
    description:
      'Grade II–III rapids on the Kali, usually October to June — subject to Supa Dam release. Irshad checks before you drive out.',
    pageTitle: 'White water rafting on the Kali',
    eyebrow: 'Things to do',
    lede: rafting.blurb,
    sections: [
      section('Before you book', rafting.caveat ?? ''),
      section(
        'How it fits the day',
        `${rafting.duration ?? ''} ${rafting.season ? `Usually ${rafting.season}.` : ''}`.trim(),
      ),
    ],
    faqs: [],
    quotes: [
      quote('white water rafting', 'helped us book white water rafting'),
      quote('rafting event', 'good mid rafting event'),
    ].filter(Boolean),
    whatsappMessage:
      'Hi Irshad, we are interested in white water rafting at Dandeli.\n\nDates: \nGroup size: \nPickup from: ',
    enquiryTopic: 'White water rafting',
    heroImage: img(pick('region', 'rafting')),
  }),
  page({
    _id: 'marketing-things-to-do-jungle-safari',
    section: 'things-to-do',
    slug: 'jungle-safari',
    published: true,
    title: 'Jungle safari in Kali Tiger Reserve | Namaste Dandeli',
    description:
      'Open-jeep safari with a forest guide. Morning collection around 5:15. No sighting is promised.',
    pageTitle: 'Jungle safari at first light',
    eyebrow: 'Things to do',
    lede: safari.blurb,
    sections: [
      section('The early start', safari.caveat ?? ''),
      section(
        'On the ground',
        `${safari.duration ?? ''}. ${safari.season ? `Best in ${safari.season}.` : ''}`.trim(),
      ),
    ],
    faqs: [],
    quotes: [
      quote('sight seeing in dandeli forest', 'sight seeing in dandeli forest'),
    ].filter(Boolean),
    whatsappMessage:
      'Hi Irshad, we want a jungle safari in Dandeli.\n\nDates: \nGroup size: \nWhich slot suits us: ',
    enquiryTopic: 'Jungle safari',
    heroImage: img(pick('region', 'forestRoad')),
  }),
  page({
    _id: 'marketing-routes-hub',
    section: 'routes',
    slug: 'hub',
    published: true,
    title: 'Dandeli airport and station transfers | Namaste Dandeli',
    description:
      'Confirmed drive times to Dandeli bus stand from Hubballi, Alnavar, Londa, Belagavi and Goa airports.',
    pageTitle: 'Getting to Dandeli',
    eyebrow: 'Routes',
    lede: 'These are measured on the road to Dandeli bus stand — the times Irshad quotes on the phone. Outstation weeks (Goa, Gokarna, Mysore) are planned together; there is no fixed fare until he knows your dates.',
    sections: [
      section(
        undefined,
        'Pick the route below for notes from real trips. For anything else, call — a wrong drive time on a cab site means a missed flight.',
      ),
    ],
    faqs: [],
    quotes: [],
    whatsappMessage:
      'Hi Irshad, I need a transfer to or from Dandeli.\n\nFrom: \nTo: \nDate and time: \nPassengers: ',
    enquiryTopic: 'Transfer',
    heroImage: img(pick('region', 'kaliHabitat')),
  }),
);

const routePages = [
  {
    id: 'hubballi-airport',
    slug: 'hubballi-airport',
    from: 'Hubballi Airport (HBX)',
    title: 'Hubballi airport to Dandeli cab',
    lede: 'The nearest airport. Irshad meets you at HBX and drives you to town or straight to your stay.',
    note: 'The nearest airport.',
    quotes: [quote('hubli to dandeli', 'hubli to dandeli')],
  },
  {
    id: 'hubballi-city',
    slug: 'hubballi-city',
    from: 'Hubballi city & station',
    title: 'Hubballi city and station to Dandeli',
    lede: 'For guests already in Hubballi or arriving at the city railway station.',
    quotes: [quote('hubli to dandeli')],
  },
  {
    id: 'alnavar-junction',
    slug: 'alnavar-junction',
    from: 'Alnavar Junction',
    title: 'Alnavar Junction to Dandeli taxi',
    lede: 'The closest railway stop. Common for resort pick-ups and family groups.',
    note: 'The closest railway station.',
    quotes: [quote('Alnavar railway', 'pick up from Alnavar')],
  },
  {
    id: 'londa-junction',
    slug: 'londa-junction',
    from: 'Londa Junction',
    title: 'Londa Junction to Dandeli cab',
    lede: 'Handy if you are coming from Goa or down the Konkan coast.',
    note: 'Best if you are coming from Goa or the Konkan coast.',
    quotes: [quote('londa', 'londa')],
  },
  {
    id: 'belagavi-airport',
    slug: 'belagavi-airport',
    from: 'Belagavi Airport (IXG)',
    title: 'Belagavi airport to Dandeli',
    lede: 'IXG is farther than Hubballi but works when that is where your flight lands.',
    quotes: [quote('Belgaum Dandeli', 'Belgaum Dandeli Pick up')],
  },
  {
    id: 'dabolim-goa',
    slug: 'dabolim-goa',
    from: 'Dabolim Airport, Goa (GOI)',
    title: 'Goa Dabolim airport to Dandeli',
    lede: 'Closer than Mopa for most Goa arrivals — whatever the booking sites tell you.',
    note: 'Closer than Mopa, whatever the booking sites tell you.',
    quotes: [quote('Goa to Dandeli', 'from Goa to Dandeli')],
  },
];

for (const r of routePages) {
  docs.push(
    page({
      _id: `marketing-routes-${r.id}`,
      section: 'routes',
      slug: r.slug,
      published: true,
      title: `${r.title} | Namaste Dandeli`,
      description: r.lede,
      pageTitle: r.title,
      eyebrow: 'Route',
      lede: r.lede,
      sections: r.note ? [section(undefined, r.note)] : [],
      faqs: [],
      quotes: (r.quotes ?? []).filter(Boolean),
      whatsappMessage: `Hi Irshad, I need a cab ${r.from} to Dandeli.\n\nDate: \nFlight or train time: \nPassengers: `,
      enquiryTopic: r.from,
      routeRefFrom: r.from,
      heroImage: img(pick('region', 'kaliHabitat')),
      routeStops: [],
    }),
  );
}

docs.push(
  page({
    _id: 'marketing-stays-hub',
    section: 'stays',
    slug: 'hub',
    published: true,
    title: 'Resort stays in Dandeli | Namaste Dandeli',
    description:
      'River cottages, treehouses and family resorts — booked through Irshad without naming properties.',
    pageTitle: 'Where you can stay',
    eyebrow: 'Stays',
    lede: 'Irshad books people into places he works with. Resorts are not named here on purpose: a named resort gets booked direct and he loses the introduction.',
    sections: [],
    faqs: [],
    quotes: [],
    whatsappMessage: waMessages.stay,
    enquiryTopic: 'Stay in Dandeli',
    heroImage: img(pick('stay', 'on-the-river')),
  }),
);

const staySlugs = [
  { slug: 'on-the-river', kind: 'On the river', idx: 0 },
  { slug: 'in-the-trees', kind: 'In the trees', idx: 1 },
  { slug: 'pool-and-family', kind: 'Pool & family', idx: 2 },
];

for (const s of staySlugs) {
  const st = stays.find((x) => x.kind === s.kind);
  docs.push(
    page({
      _id: `marketing-stays-${s.slug}`,
      section: 'stays',
      slug: s.slug,
      published: true,
      title: `${st.kind} stays in Dandeli | Namaste Dandeli`,
      description: st.blurb,
      pageTitle: st.kind,
      eyebrow: 'Stays',
      lede: st.blurb,
      sections: [],
      faqs: [],
      quotes: [],
      whatsappMessage: `Hi Irshad, we are looking for a ${st.kind.toLowerCase()} stay in Dandeli.\n\nDates: \nGroup size: \nBudget per night: `,
      enquiryTopic: st.kind,
      heroImage: img(pick('stay', s.slug)),
    }),
  );
}

const unpublished = [
  {
    id: 'kayaking',
    blocker: 'Does Irshad arrange kayaking, where, season, and what should guests bring?',
  },
  { id: 'zipline', blocker: 'Does Irshad book zipline, and from which operator?' },
  { id: 'zorbing', blocker: 'Does Irshad arrange zorbing?' },
  { id: 'river-crossing', blocker: 'Does Irshad arrange river crossing activities?' },
  {
    id: 'kavala-caves',
    blocker: 'Does Irshad take guests to Kavala Caves, and is access open?',
  },
  { id: 'ulavi', blocker: 'Does Irshad take guests to Ulavi, and is the trek allowed?' },
  { id: 'sathodi-falls', blocker: 'Does Irshad run day trips to Sathodi Falls?' },
  { id: 'magod-falls', blocker: 'Does Irshad run day trips to Magod Falls?' },
  {
    id: 'anshi-sightseeing',
    blocker: 'Does Irshad offer Anshi / reserve sightseeing beyond the safari gate?',
  },
];

for (const u of unpublished) {
  docs.push(
    page({
      _id: `marketing-things-to-do-${u.id}`,
      section: 'things-to-do',
      slug: u.id,
      published: false,
      blocker: u.blocker,
      title: `${u.id} (draft)`,
      description: 'Draft — not published.',
      pageTitle: u.id,
      lede: 'Waiting on Irshad.',
      sections: [],
      faqs: [],
      quotes: [],
      whatsappMessage: waMessages.default,
      enquiryTopic: u.id,
    }),
  );
}

const ndjson = docs.map((d) => JSON.stringify(d)).join('\n');
writeFileSync(OUT, ndjson);
console.log(`Wrote ${docs.length} marketing documents to ${OUT}`);

if (DRY) process.exit(0);

execFileSync(
  'pnpm',
  [
    'exec',
    'sanity',
    'dataset',
    'import',
    OUT,
    DATASET,
    '--replace',
    `--project=${PROJECT}`,
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, SANITY_PROJECT_ID: PROJECT, SANITY_DATASET: DATASET },
  },
);
