/**
 * One-off: publish the legal pages (privacy policy, terms) to Sanity.
 *
 * Mirrors seed-sanity.mjs — documents written with the Studio's own
 * CLI, authenticated by the `sanity login` session, no API token.
 *
 * TWO THINGS IT DOES DIFFERENTLY, both deliberate:
 *
 * 1. siteSettings IS NOT WRITTEN AS A DOCUMENT. `--replace` replaces a
 *    document outright, so a siteSettings doc here carrying only
 *    `legalPages` would DESTROY seo, google, address, whatsapp and
 *    hours. Re-emitting every field to avoid that is worse: the script
 *    then silently drops any field added to the schema after it was
 *    written. So the reference array is applied as a surgical
 *    `client.patch().set()` through `sanity exec --with-user-token`,
 *    the same mechanism scripts/backfill-asset-meta.mjs uses. One
 *    field changes, by construction rather than by remembering.
 *
 * 2. It uses the CLI, not the MCP. An MCP write creates a DRAFT, and a
 *    draft cannot satisfy a reference — siteSettings.legalPages would
 *    point at documents the published perspective cannot see, and the
 *    site (perspective: 'published') would render an empty footer with
 *    no error anywhere.
 *
 * ARRAY ORDER IS THE FOOTER ORDER. Privacy policy first.
 *
 * Every contact detail is read from the live siteSettings, never typed
 * here — the pages must say what the Studio says.
 *
 *   node scripts/seed-legal.mjs --dry-run
 *   node scripts/seed-legal.mjs
 */
import { createServer } from 'vite';
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';

const DRY = process.argv.includes('--dry-run');
const PROJECT = process.env.SANITY_PROJECT_ID ?? 'krbamcti';
const DATASET = process.env.SANITY_DATASET ?? 'production';
const CLI = 'node_modules/.bin/sanity';
const OUT = 'scripts/.seed-legal.ndjson';

/* The date these documents take effect. Not "today" at render time —
   a legal page's effective date is a fact about the document, so it is
   written once, here, and only changes when the MEANING changes. */
const EFFECTIVE = '2026-11-06';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'silent',
});
const c = await server.ssrLoadModule('/src/content/index.ts');
const { site } = await c.getContent();
await server.close();

/* Contact details, read from Sanity. The WhatsApp number is behind the
   guard and currently unconfirmed, so it falls back to the verified
   phone — exactly as every CTA on the site already does. */
const wa = site.whatsapp.confirmed ? site.whatsapp.value : site.whatsapp.fallback;

let n = 0;
const key = () => `k${(n++).toString(36)}`;

/** A Portable Text block. `style: 'h1'` renders as <h2> — see LegalBody.astro. */
const block = (style, text, markDefs = []) => ({
  _type: 'block',
  _key: key(),
  style,
  markDefs,
  children: [{ _type: 'span', _key: key(), text, marks: [] }],
});
const p = (text) => block('normal', text);
const h = (text) => block('h1', text);
const li = (text) => ({ ...block('normal', text), listItem: 'bullet', level: 1 });

/* A paragraph with one link. The mark lives in markDefs and is
   referenced by key from the span — the shape the renderer expects. */
const linked = (before, label, href, after) => {
  const mk = key();
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [{ _type: 'link', _key: mk, href }],
    children: [
      { _type: 'span', _key: key(), text: before, marks: [] },
      { _type: 'span', _key: key(), text: label, marks: [mk] },
      { _type: 'span', _key: key(), text: after, marks: [] },
    ],
  };
};

const contactBlocks = [
  h('How to reach him'),
  p(
    `${site.legalName} is run by ${site.owner}, from ${site.address.street}, ` +
      `${site.address.locality}, ${site.address.region} ${site.address.postalCode}.`,
  ),
  li(`Phone: ${site.phoneDisplay}`),
  li(`WhatsApp: +${wa.replace(/^\+/, '')}`),
  li(`Email: ${site.email}`),
];

const docs = [
  {
    _id: 'legal-privacy-policy',
    _type: 'legalPage',
    title: 'Privacy policy',
    slug: { _type: 'slug', current: 'privacy-policy' },
    description:
      'What this website collects, what Irshad holds when you call or message ' +
      'him about a trip, and how to ask him to delete it.',
    effectiveDate: EFFECTIVE,
    body: [
      p(
        'This site is a brochure. You cannot book on it, and it asks you for ' +
          'nothing. The only personal information Irshad holds is what you give ' +
          'him when you call or message him about a trip.',
      ),

      h('What this website collects'),
      p(
        'Nothing you type, because there is no form, no account and no payment ' +
          'page. The site runs without any JavaScript of its own.',
      ),
      p(
        'Google Analytics is used to count visits and see which pages people ' +
          'read. It records your approximate location, your device and your ' +
          'browser, and it sets its own cookies to tell one visit from another. ' +
          'It does not tell us who you are, and we do not try to find out.',
      ),

      h('What Irshad collects when you contact him'),
      p(
        'Your name, your phone number, your dates, how many of you there are, ' +
          'and where you want picking up. You give it voluntarily, over the ' +
          'phone or on WhatsApp, so that he can arrange the trip you asked ' +
          'about. He asks for nothing else.',
      ),

      h('Who else sees it'),
      p(
        'Arranging a stay means passing your name, your dates and your group ' +
          'size to the property you are booked into. That is the introduction ' +
          'you asked him to make, and it is the only reason your details go ' +
          'anywhere. Nothing is sold, and nothing is shared for advertising.',
      ),
      p(
        'Messages you send travel through WhatsApp and are subject to its own ' +
          'privacy terms, not ours. Email you send sits in Gmail, under ' +
          "Google's.",
      ),

      h('How long he keeps it'),
      p(
        "Trip details stay in his phone's call and message history, the way any " +
          'driver keeps a customer’s number. Ask him to delete yours and he ' +
          'will.',
      ),

      h('Your rights'),
      p(
        'You can ask what he holds about you, ask him to correct it, or ask him ' +
          'to delete it. Phone or email him and he will do it. He answers his ' +
          'own phone.',
      ),
      linked(
        "India's Digital Personal Data Protection Act 2023 will require this of " +
          'every business once its remaining provisions commence in May 2027. ' +
          'This policy is written to meet it now rather than later. You can read ',
        'the Act and its rules',
        'https://www.meity.gov.in/data-protection-framework',
        ' yourself.',
      ),

      h('Cookies'),
      p(
        'Only Google Analytics sets cookies here. Block or clear them and the ' +
          'site works exactly as before, because nothing on it depends on them.',
      ),

      ...contactBlocks,

      h('If this policy changes'),
      p(
        'The date at the top of this page changes with it. There is no mailing ' +
          'list to notify, because there is no mailing list.',
      ),
    ],
  },
  {
    _id: 'legal-terms-and-conditions',
    _type: 'legalPage',
    title: 'Terms and conditions',
    slug: { _type: 'slug', current: 'terms-and-conditions' },
    description:
      'What this website is and is not: no booking happens here, and nothing ' +
      'on it is a promise about a date or a sighting.',
    effectiveDate: EFFECTIVE,
    body: [
      p(
        'Short version: this website tells you what is possible in Dandeli. ' +
          'Nothing here is a booking, and nothing here is a promise about a date.',
      ),

      h('No booking happens on this website'),
      p(
        'There is no checkout, no availability calendar and no instant ' +
          'confirmation. Every trip, every cab and every stay is arranged ' +
          'directly with Irshad by phone or WhatsApp, and nothing is confirmed ' +
          'until he says so.',
      ),

      h('About the stays he arranges'),
      p(
        'He has tie-ups with resorts and places guests into them. The resorts ' +
          'are not named on this site on purpose: the introduction is the ' +
          'service he is paid for, and a named resort gets booked direct. Tell ' +
          'him your dates, your group and your budget and he will tell you what ' +
          'is actually free.',
      ),

      h('Information on this site can change'),
      p(
        'Prices, drive times and distances are indicative, and were accurate ' +
          'when they were measured. Roads, fuel and traffic all move. Confirm ' +
          'anything you are relying on with him before you rely on it.',
      ),

      h('Rafting and the river'),
      p(
        'Rafting on the Kali depends on water released from Supa Dam. It does ' +
          'not depend on the calendar and it does not depend on rainfall. The ' +
          'season usually runs from October to June, but no date can be ' +
          'promised, not by us and not by anyone. If the release stops, the ' +
          'rafting stops.',
      ),

      h('Wildlife is never guaranteed'),
      p(
        'Kali Tiger Reserve is wild. Hornbills, black panthers and tigers are ' +
          'all seen there, and not one of them can be promised to appear for ' +
          'your visit. Anyone who promises you a sighting is selling you ' +
          'something they do not control.',
      ),

      h('Safaris, permits and the forest'),
      p(
        'Entry, permits and timings for Kali Tiger Reserve are set by the ' +
          'Karnataka Forest Department, not by Irshad. They can change, and the ' +
          'forest can close, without notice and without warning to him.',
      ),

      h('Photographs, illustrations and text'),
      p(
        'The text on this site, the Namaste Dandeli monogram and the ' +
          'commissioned illustrations of Irshad with each vehicle are his. The ' +
          'illustrations are illustrations, and the site says so where they ' +
          'appear. They are not photographs of a specific journey.',
      ),
      p(
        'Several photographs are licensed from Wikimedia Commons under CC BY-SA ' +
          '4.0 and are credited under "Photograph credits" at the bottom of ' +
          'every page. Reusing one carries the same attribution and share-alike ' +
          'obligation it carries for us. Do not reuse his own photographs or ' +
          'this text without asking him first.',
      ),

      h('Links to other websites'),
      p(
        'Links out to Google Maps, Karnataka Tourism, WhatsApp and similar sites ' +
          'are there for your convenience. What those sites contain is theirs, ' +
          'not ours, and we cannot answer for it.',
      ),

      ...contactBlocks,
    ],
  },
];

/* THE INVARIANT this script depends on. `--replace` replaces each
   document in the file outright, which is safe only while every
   document here is a legalPage. A siteSettings doc would lose fields. */
if (docs.some((d) => d._type !== 'legalPage')) {
  throw new Error(
    'seed-legal.mjs writes with --replace, which replaces each document ' +
      'outright. Only legalPage docs may be in this file — a siteSettings doc ' +
      'here would destroy seo, google, address and hours. Apply siteSettings ' +
      'changes with the patch step below instead.',
  );
}

/* NDJSON for `dataset import`.
   NOT `documents create`: that parses the whole file as one JSON5
   value and fails on the second object ("invalid character '{'"), so
   it cannot take more than one document per call. */
writeFileSync(OUT, docs.map((d) => JSON.stringify(d)).join('\n') + '\n');

for (const d of docs) {
  const text = d.body
    .flatMap((b) => b.children ?? [])
    .map((s) => s.text)
    .join(' ');
  console.log(`  ${d._id}  ${d.body.length} blocks, ${text.length} chars`);
}

if (DRY) {
  console.log(`\n--dry-run: wrote ${OUT}, published nothing.`);
  process.exit(0);
}

execFileSync(
  CLI,
  ['dataset', 'import', `../${OUT}`, '--dataset', DATASET, '--replace', '-p', PROJECT],
  { stdio: 'inherit', cwd: 'studio' },
);

/* The reference array, as a one-field patch — never a document write.
   Order here IS the footer order. */
const refs = docs.map((d) => ({ _type: 'reference', _key: d._id, _ref: d._id }));
writeFileSync(
  'studio/.seed-legal-patch.cjs',
  `const { createClient } = require('@sanity/client');
// SANITY_AUTH_TOKEN is injected by \`sanity exec --with-user-token\`.
const client = createClient({
  projectId: '${PROJECT}',
  dataset: '${DATASET}',
  apiVersion: '2026-11-05',
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
});
client
  .patch('siteSettings')
  .set({ legalPages: ${JSON.stringify(refs)} })
  .commit()
  .then(() => console.log('siteSettings.legalPages set (${refs.length} refs, in order)'))
  .catch((e) => { console.error(e.message); process.exit(1); });
`,
);
try {
  execFileSync(CLI, ['exec', '--with-user-token', '.seed-legal-patch.cjs'], {
    stdio: 'inherit',
    cwd: 'studio',
  });
} finally {
  unlinkSync('studio/.seed-legal-patch.cjs');
}
console.log('\npublished.');
