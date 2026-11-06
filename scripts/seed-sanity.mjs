/**
 * One-off: seed Sanity from the existing src/content modules.
 *
 * Loads the real modules through Vite (the same trick
 * report-blockers.mjs uses) rather than re-typing their contents, so
 * the seed cannot drift from what the site renders today.
 *
 * Confirmed<T> is flattened on the way in: the union's branches become
 * one object with every key. The adapter rebuilds the union on the way
 * out — see narrowConfirmed in src/content/index.ts. An unconfirmed
 * fact seeds with `confirmed: false` and keeps its fallback/blocker,
 * so nothing becomes publishable just by moving house.
 *
 * Writes NDJSON and imports it with the Sanity CLI, which authenticates
 * with the `sanity login` session — no API token needed.
 *
 *   node scripts/seed-sanity.mjs --dry-run
 *   node scripts/seed-sanity.mjs
 */
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');
const PROJECT = process.env.SANITY_PROJECT_ID ?? 'krbamcti';
const DATASET = process.env.SANITY_DATASET ?? 'production';
const OUT = 'scripts/.seed.ndjson';

const assets = JSON.parse(readFileSync('scripts/asset-ids.json', 'utf8'));
const pick = (group, slot) =>
  assets.filter((a) => a.group === group && (slot === undefined || a.slot === slot));

/** An imageWithMeta value pointing at an uploaded asset. */
const img = (a) => ({
  _type: 'imageWithMeta',
  _key: a.assetId.slice(6, 22),
  asset: { _type: 'reference', _ref: a.assetId },
  alt: a.alt,
  ...(a.credit ? { credit: a.credit } : {}),
  licence: a.licence,
  subject: a.subject,
});

/** Confirmed<T> -> the flat object Sanity stores. */
const flat = (f) =>
  f.confirmed
    ? {
        confirmed: true,
        value: String(f.value),
        confirmedOn: f.confirmedOn,
        ...(f.source ? { source: f.source } : {}),
      }
    : { confirmed: false, fallback: f.fallback, blocker: f.blocker };

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});
const c = await server.ssrLoadModule('/src/content/index.ts');
const { site, vehicles, activities, stays, routes, reviews, assurances } =
  await c.getContent();

const docs = [];

docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  name: site.name,
  legalName: site.legalName,
  googleName: site.googleName,
  alsoKnownAs: site.alsoKnownAs,
  owner: site.owner,
  ownerShort: site.ownerShort,
  phone: site.phone,
  phoneDisplay: site.phoneDisplay,
  email: site.email,
  whatsapp: flat(site.whatsapp),
  hours: flat(site.hours),
  address: { ...site.address },
  serviceAreas: [...site.serviceAreas],
  google: { ...site.google },
  seo: {
    title: 'Namaste Dandeli — taxi, trips and resort bookings in Dandeli',
    description:
      'Irshad drives tourists around Dandeli — rafting at Ganeshgudi, jungle safari in Kali Tiger Reserve, airport pickups from Hubballi and Goa — and books the resort too. 4.9 stars from 160+ Google reviews.',
    ogTitle: 'Namaste Dandeli',
    ogSubtitle: 'Cabs, trips and stays\nacross Dandeli',
    ogPlace: 'Alur · Dandeli · Karnataka',
  },
});

// Vehicles. The illustrations are the primary image; the matching real
// photographs follow, so a card can carry both.
const vehiclePhotos = { Sedan: 'sedan', Ertiga: 'innova', Cruiser: 'cruiser' };
vehicles.forEach((v, i) => {
  const illo = pick('illustration', vehiclePhotos[v.name]);
  const real =
    v.name === 'Cruiser'
      ? pick('vehicle', 'innova')
      : v.name === 'Sedan'
        ? pick('vehicle', 'fleet')
        : [];
  docs.push({
    _id: `vehicle-${v.kind}`,
    _type: 'vehicle',
    name: v.name,
    seats: v.seats,
    suits: v.suits,
    note: v.note,
    photos: [...illo, ...real].map(img),
    order: i,
  });
});

// Activities keep their region photograph, now served from our CDN.
const activityImage = {
  'White water rafting': ['activity', 'rafting'],
  'Jungle safari': ['region', 'hornbill'],
  'Coracle ride': ['region', 'coracle'],
  Birdwatching: ['region', 'hornbill'],
  'Syntheri Rocks': ['region', 'syntheri'],
  'Supa Dam & Sykes Point': ['region', 'sykesPoint'],
};
activities.forEach((a, i) => {
  const [g, s] = activityImage[a.name] ?? ['region', 'kaliHabitat'];
  docs.push({
    _id: `activity-${i}`,
    _type: 'activity',
    name: a.name,
    blurb: a.blurb,
    ...(a.duration ? { duration: a.duration } : {}),
    ...(a.season ? { season: a.season } : {}),
    ...(a.caveat ? { caveat: a.caveat } : {}),
    photos: pick(g, s).slice(0, 1).map(img),
    order: i,
  });
});

// Stays: real photographs of the partner properties, grouped by kind.
const staySlot = { 'On the river': 'on-the-river', 'In the trees': 'in-the-trees' };
stays.forEach((s, i) => {
  const slot = staySlot[s.kind] ?? 'pool-and-family';
  docs.push({
    _id: `stay-${slot}`,
    _type: 'stay',
    kind: s.kind,
    blurb: s.blurb,
    photos: pick('stay', slot).slice(0, 6).map(img),
    order: i,
  });
});

routes.forEach((r, i) => {
  const d = r.distance;
  docs.push({
    _id: `route-${i}`,
    _type: 'route',
    from: r.from,
    to: r.to,
    ...(r.note ? { note: r.note } : {}),
    distance: d.confirmed
      ? {
          confirmed: true,
          km: d.value.km,
          drive: d.value.drive,
          confirmedOn: d.confirmedOn,
          ...(d.source ? { source: d.source } : {}),
        }
      : { confirmed: false, fallback: d.fallback, blocker: d.blocker },
    order: i,
  });
});

reviews.forEach((r, i) => {
  docs.push({
    _id: `review-${i}`,
    _type: 'review',
    author: r.author,
    rating: r.rating,
    date: r.date,
    dateLabel: r.dateLabel,
    text: r.text,
    role: r.role,
    ...(r.pull ? { pull: r.pull } : {}),
    featured: i === 0, // was `featuredReview = reviews[0]`; now explicit
    order: i,
  });
});

assurances.forEach((a, i) => {
  docs.push({
    _id: `assurance-${i}`,
    _type: 'assurance',
    fact: flat(a),
    order: i,
  });
});

await server.close();

const ndjson = docs.map((d) => JSON.stringify(d)).join('\n') + '\n';
writeFileSync(OUT, ndjson);

const byType = docs.reduce((a, d) => ({ ...a, [d._type]: (a[d._type] ?? 0) + 1 }), {});
console.log(`${docs.length} document(s):`);
for (const [t, n] of Object.entries(byType))
  console.log(`  ${String(n).padStart(3)}  ${t}`);

const unconfirmed = docs.filter(
  (d) =>
    d.whatsapp?.confirmed === false ||
    d.hours?.confirmed === false ||
    d.distance?.confirmed === false ||
    d.fact?.confirmed === false,
).length;
console.log(
  `\n${unconfirmed} document(s) carry an unconfirmed fact — they keep their fallback.`,
);

if (DRY) {
  console.log(`\n--dry-run: wrote ${OUT}, imported nothing.`);
  process.exit(0);
}

execFileSync(
  'studio/node_modules/.bin/sanity',
  ['dataset', 'import', OUT, DATASET, '--replace', '-p', PROJECT],
  { stdio: 'inherit' },
);
console.log('\nimported.');
