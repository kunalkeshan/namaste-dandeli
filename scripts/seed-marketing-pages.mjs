/**
 * Seed marketingPage documents into Sanity.
 *
 *   node scripts/seed-marketing-pages.mjs --dry-run
 *   node scripts/seed-marketing-pages.mjs
 *
 * Production import: one Vercel rebuild (pause → import → trigger → resume).
 * See docs/deploy-on-publish.md. Pass --no-rebuild-pause to skip.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { withSingleProductionRebuild, skipRebuildPause } from './sanity-bulk-write.mjs';
import { faqsFor, routeFaqs } from './marketing-faqs.mjs';

const DRY = process.argv.includes('--dry-run');
const PROJECT = process.env.SANITY_PROJECT_ID ?? 'krbamcti';
const DATASET = process.env.SANITY_DATASET ?? 'production';
const OUT = 'scripts/.seed-marketing.ndjson';

const assets = JSON.parse(readFileSync('scripts/asset-ids.json', 'utf8'));
const research = JSON.parse(readFileSync('scripts/reviews-research.json', 'utf8'));
const routeGeometries = JSON.parse(readFileSync('scripts/route-geometries.json', 'utf8'));

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

const routeStop = (name, lat, lng, note) => ({
  _type: 'routeStop',
  _key: name.replace(/\W/g, '').slice(0, 12),
  name,
  lat,
  lng,
  ...(note ? { note } : {}),
});

const DANDELI_STAND = routeStop(
  'Dandeli bus stand',
  15.2667,
  74.6183,
  'Schematic endpoint for the map — not turn-by-turn navigation.',
);

const activityPage = ({
  id,
  slug,
  act,
  regionSlot,
  title,
  pageTitle,
  quoteNeedles = [],
  extraSections = [],
}) => {
  const hero = img(pick('region', regionSlot));
  return page({
    _id: `marketing-things-to-do-${id}`,
    section: 'things-to-do',
    slug,
    published: true,
    title,
    description: act.blurb.slice(0, 155),
    pageTitle,
    eyebrow: 'Things to do',
    lede: act.blurb,
    activityName: act.name,
    sections: [
      ...(act.caveat ? [section('Before you book', act.caveat)] : []),
      ...(act.duration || act.season
        ? [
            section(
              'How it fits the day',
              `${act.duration ?? ''} ${act.season ? `Usually ${act.season}.` : ''}`.trim(),
            ),
          ]
        : []),
      ...extraSections,
    ],
    faqs: faqsFor('things-to-do', slug),
    quotes: [
      ...new Map(
        quoteNeedles
          .map((n) => quote(n))
          .filter(Boolean)
          .map((q) => [q.text, q]),
      ).values(),
    ],
    whatsappMessage: `Hi Irshad, we are interested in ${act.name.toLowerCase()} at Dandeli.\n\nDates: \nGroup size: \nPickup from: `,
    enquiryTopic: act.name,
    heroImage: hero,
    cardImage: hero,
  });
};

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
const { staysDisclosure } = stayMod;
const { waMessages } = copyMod;
const routeMod = await server.ssrLoadModule('/src/content/routes.ts');
const routesList = routeMod.routes;
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
    faqs: faqsFor('things-to-do', 'hub'),
    quotes: [],
    whatsappMessage:
      'Hi Irshad, we are planning activities in Dandeli.\n\nDates: \nGroup size: \nWhat we want to try: ',
    enquiryTopic: 'Dandeli activities',
    heroImage: img(pick('region', 'rafting')),
  }),
);

if (rafting) {
  docs.push(
    activityPage({
      id: 'white-water-rafting',
      slug: 'white-water-rafting',
      act: rafting,
      regionSlot: 'rafting',
      title: 'White water rafting in Dandeli | Namaste Dandeli',
      pageTitle: 'White water rafting on the Kali',
      quoteNeedles: ['white water rafting', 'rafting event'],
      extraSections: [
        section(
          'Why Supa Dam matters',
          'The Kali does not run on monsoon rain alone. Water released from Supa Dam is what makes Grade II–III rapids possible — usually October to June, but never on a fixed calendar date. Irshad checks the release before you pay.',
        ),
        section(
          'At Ganeshgudi',
          'The commercial run is nine to twelve kilometres with a trained guide and life jackets in every raft. Non-swimmers go; the honest limit is whether the river is actually flowing that week.',
        ),
        section(
          'How Irshad fits in',
          'He books the operator slot, drives you from stay or bus stand, and will tell you to postpone rather than sit on a dry riverbed. That check is why guests book through him instead of guessing online.',
        ),
      ],
    }),
  );
}

if (safari) {
  docs.push(
    activityPage({
      id: 'jungle-safari',
      slug: 'jungle-safari',
      act: safari,
      regionSlot: 'forestRoad',
      title: 'Jungle safari in Kali Tiger Reserve | Namaste Dandeli',
      pageTitle: 'Jungle safari at first light',
      quoteNeedles: ['sight seeing in dandeli forest'],
      extraSections: [
        section(
          'Why 5:15',
          'The 6am gate slot means collection while it is still dark. You are at the reserve before heat and noise build — that is when deer and giant squirrels are easiest to see on the track.',
        ),
        section(
          'What the forest is',
          'Kali Tiger Reserve is the official name. Gaur, sambar, langur and Malabar giant squirrel are common on a good run. Tigers and black panthers live here; anyone who promises them is lying.',
        ),
        section(
          'How Irshad fits in',
          'Forest department guides ride in the jeep with you. Irshad books the permit, handles the drive, and tells you when morning slots are full.',
        ),
      ],
    }),
  );
}

for (const spec of [
  {
    id: 'coracle-ride',
    slug: 'coracle-ride',
    regionSlot: 'coracle',
    pageTitle: 'Coracle rides on the Kali',
    title: 'Coracle rides on the Kali | Namaste Dandeli',
    extraSections: [
      section(
        'Good with mixed ages',
        'The round bamboo boat is the gentle option when grandparents or small children are in the group. Irshad books the slot and drives you to the river put-in.',
      ),
      section(
        'On the water',
        'The current carries the coracle — quiet enough that kingfishers and marsh crocodiles sometimes show at the banks. Guides pole the boat; this is not a swimming stop.',
      ),
      section(
        'How Irshad fits in',
        'He lines up the operator and times the drive from your stay. Mention if anyone needs a hand stepping in or out of the boat.',
      ),
    ],
  },
  {
    id: 'birdwatching',
    slug: 'birdwatching',
    regionSlot: 'hornbill',
    pageTitle: 'Birdwatching around Ganeshgudi',
    title: 'Birdwatching in Dandeli | Namaste Dandeli',
    extraSections: [
      section(
        'Why the early start',
        'Hornbills and forest birds are active at dawn. Ganeshgudi is the usual base — Irshad lines up a guide and the drive so you are on the trail while it is still cool.',
      ),
      section(
        'What serious birders know',
        'Four hornbill species live in this landscape, among around 270 recorded species. Malabar pied and Malabar grey hornbills are the ones guests ask about most — no sighting is guaranteed, but the forest at first light is when calls and movement are easiest to follow.',
      ),
      section(
        'How Irshad fits in',
        'He does not guide the trail himself; he gets you to the right patch at the right hour and back for breakfast. Tell him if you are a photographer with a heavy lens — the vehicle choice matters.',
      ),
    ],
  },
  {
    id: 'syntheri-rocks',
    slug: 'syntheri-rocks',
    regionSlot: 'syntheri',
    pageTitle: 'Syntheri Rocks day trip',
    title: 'Syntheri Rocks near Dandeli | Namaste Dandeli',
    extraSections: [
      section(
        'Kaneri river, not the Kali',
        'Syntheri Rocks sits in a valley carved by the Kaneri — easy to confuse with the Kali on a map. The monolith is about three hundred feet of granite above the water.',
      ),
      section(
        'The steps down',
        'A few hundred steps to the base. Pack water and shoes with grip. Irshad skips the trip in heavy monsoon when the steps get slick.',
      ),
      section(
        'How Irshad fits in',
        'Half day from Dandeli with the drive and entry coordination. He confirms access the morning you go.',
      ),
    ],
  },
  {
    id: 'supa-dam-sykes-point',
    slug: 'supa-dam-sykes-point',
    regionSlot: 'sykesPoint',
    pageTitle: 'Supa Dam and Sykes Point',
    title: 'Supa Dam & Sykes Point | Namaste Dandeli',
    extraSections: [
      section(
        'Evening light',
        'The reservoir feeds rafting releases on the Kali below. Sykes Point is the viewpoint run — access sometimes needs permission, so Irshad confirms before you set out.',
      ),
      section(
        'Supa and rafting',
        'If you are rafting the same trip, seeing the dam puts the river in context — the release schedule upstream is what makes the rapids runnable, not rainfall alone.',
      ),
      section(
        'How Irshad fits in',
        'He books timing for the evening viewpoint and checks permission when Sykes Point is restricted. Tell him if you want this the same day as rafting or coracles.',
      ),
    ],
  },
]) {
  const act = activities.find((a) =>
    spec.slug === 'coracle-ride'
      ? a.name === 'Coracle ride'
      : spec.slug === 'birdwatching'
        ? a.name === 'Birdwatching'
        : spec.slug === 'syntheri-rocks'
          ? a.name === 'Syntheri Rocks'
          : a.name.startsWith('Supa Dam'),
  );
  if (!act) continue;
  docs.push(
    activityPage({
      id: spec.id,
      slug: spec.slug,
      act,
      regionSlot: spec.regionSlot,
      title: spec.title,
      pageTitle: spec.pageTitle,
      extraSections: spec.extraSections,
    }),
  );
}

docs.push(
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
    faqs: faqsFor('routes', 'hub'),
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
    card: 'forestRoad',
    alongTheWay:
      'From HBX you join the road toward Haliyal and the greener Western Ghats stretch. The drive mixes highway and forest edge — tea stops when you need them, timed around your flight.',
    stops: [routeStop('Hubballi airport (HBX)', 15.3627, 75.0868), DANDELI_STAND],
    quotes: [quote('hubli to dandeli', 'hubli to dandeli')],
  },
  {
    id: 'hubballi-city',
    slug: 'hubballi-city',
    from: 'Hubballi city & station',
    title: 'Hubballi city and station to Dandeli',
    lede: 'For guests already in Hubballi or arriving at the city railway station.',
    card: 'kaliHabitat',
    alongTheWay:
      'City traffic first, then the same climb toward Haliyal that airport guests see — Irshad picks you up at the station forecourt or your hotel and keeps the quoted time to Dandeli bus stand.',
    stops: [routeStop('Hubballi city', 15.3647, 75.124), DANDELI_STAND],
    quotes: [quote('hubli to dandeli')],
  },
  {
    id: 'alnavar-junction',
    slug: 'alnavar-junction',
    from: 'Alnavar Junction',
    title: 'Alnavar Junction to Dandeli taxi',
    lede: 'The closest railway stop. Common for resort pick-ups and family groups.',
    note: 'The closest railway station.',
    card: 'forestRoad',
    alongTheWay:
      'A short run from the platform into forested side roads toward Dandeli — popular for families getting dropped at a resort gate rather than the bus stand.',
    stops: [routeStop('Alnavar Junction', 15.4271, 74.7406), DANDELI_STAND],
    quotes: [quote('Alnavar railway', 'pick up from Alnavar')],
  },
  {
    id: 'londa-junction',
    slug: 'londa-junction',
    from: 'Londa Junction',
    title: 'Londa Junction to Dandeli cab',
    lede: 'Handy if you are coming from Goa or down the Konkan coast.',
    note: 'Best if you are coming from Goa or the Konkan coast.',
    card: 'forestRoad',
    alongTheWay:
      'From Londa you wind into the hills toward Dandeli — thick forest on either side on a good day. Irshad meets trains that arrive late as well as morning slots.',
    stops: [routeStop('Londa Junction', 15.4085, 74.518), DANDELI_STAND],
    quotes: [quote('londa', 'londa')],
  },
  {
    id: 'belagavi-airport',
    slug: 'belagavi-airport',
    from: 'Belagavi Airport (IXG)',
    title: 'Belagavi airport to Dandeli',
    lede: 'IXG is farther than Hubballi but works when that is where your flight lands.',
    card: 'kaliHabitat',
    alongTheWay:
      'Longer than HBX but straightforward highway time — useful when Belagavi is on your ticket and Hubballi is not.',
    stops: [routeStop('Belagavi airport (IXG)', 15.8593, 74.6183), DANDELI_STAND],
    quotes: [quote('Belgaum Dandeli', 'Belgaum Dandeli Pick up')],
  },
  {
    id: 'dabolim-goa',
    slug: 'dabolim-goa',
    from: 'Dabolim Airport, Goa (GOI)',
    title: 'Goa Dabolim airport to Dandeli',
    lede: 'Closer than Mopa for most Goa arrivals — whatever the booking sites tell you.',
    note: 'Closer than Mopa, whatever the booking sites tell you.',
    card: 'kaliHabitat',
    alongTheWay:
      'You cross from coastal Goa into Karnataka’s forest roads. It is a measured run to Dandeli bus stand — not the inflated “three hours” some booking sites quote.',
    stops: [routeStop('Dabolim airport, Goa (GOI)', 15.3808, 73.8314), DANDELI_STAND],
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
      sections: [
        ...(r.note ? [section('Why guests choose this route', r.note)] : []),
        section(
          'Pickup and drop',
          `Irshad quotes the fare for ${r.from} to Dandeli after he knows your date, time and group size. Pickup is at the airport, station or hotel you name; drop is usually Dandeli bus stand unless you are heading straight to a resort he books for you.`,
        ),
      ],
      faqs: [...routeFaqs(routesList, r.from), ...faqsFor('routes', r.slug)],
      quotes: (r.quotes ?? []).filter(Boolean),
      whatsappMessage: `Hi Irshad, I need a cab ${r.from} to Dandeli.\n\nDate: \nFlight or train time: \nPassengers: `,
      enquiryTopic: r.from,
      routeRefFrom: r.from,
      alongTheWay: r.alongTheWay,
      heroImage: img(pick('region', r.card ?? 'kaliHabitat')),
      cardImage: img(pick('region', r.card ?? 'kaliHabitat')),
      routeStops: routeGeometries[r.slug] ?? r.stops ?? [],
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
    faqs: faqsFor('stays', 'hub'),
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
      stayKind: st.kind,
      sections: [
        section(
          'What you are choosing',
          s.slug === 'on-the-river'
            ? 'You hear the Kali at night and sit close to rafting and coracle put-ins. Irshad matches you to a river-side cottage or tent camp that is actually free for your dates.'
            : s.slug === 'in-the-trees'
              ? 'Treehouses and jungle camps set back from the road — darker evenings, hornbills at dawn, less pool noise. He knows which owners still take walk-ins through him.'
              : 'Larger properties with a pool and restaurant when children or a big group need space. He quotes what is free rather than a brochure rate.',
        ),
        section(
          'Around Dandeli',
          'Whatever you pick, you are still in the Kali valley — forest birds, the river, and safari starts before breakfast when you book the morning slot.',
        ),
        section('Photographs and names', staysDisclosure),
        section(
          'Availability and price',
          'Rates on booking sites are often stale. Irshad quotes what is actually free for your dates, group size and budget, then holds the room through his contact — not a brochure number.',
        ),
        section(
          s.slug === 'on-the-river'
            ? 'River-first days'
            : s.slug === 'in-the-trees'
              ? 'Forest mornings'
              : 'Families and groups',
          s.slug === 'on-the-river'
            ? 'Rafting and coracle put-ins are easiest from river-side stays — shorter transfers and less road time when Supa releases are early.'
            : s.slug === 'in-the-trees'
              ? 'Jungle camps suit guests who want the 5:15 safari pickup and dawn birding without driving in from town each morning.'
              : 'Pool properties handle meal timings, extra beds and noisy children better — worth saying ages and headcount up front when you message him.',
        ),
      ],
      faqs: faqsFor('stays', s.slug),
      quotes: [],
      whatsappMessage: `Hi Irshad, we are looking for a ${st.kind.toLowerCase()} stay in Dandeli.\n\nDates: \nGroup size: \nBudget per night: `,
      enquiryTopic: st.kind,
      heroImage: img(pick('stay', s.slug)),
      cardImage: img(pick('stay', s.slug)),
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

withSingleProductionRebuild(
  () =>
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
    ),
  { skip: skipRebuildPause() },
);
