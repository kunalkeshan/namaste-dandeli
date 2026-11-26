/**
 * One-off parser for the saved Google listing HTML (expanded save).
 *
 * Prefers div.gbdaZe > div.d83Iyc (full text) over the collapsed preview.
 * Writes scripts/reviews-research.json — safe to commit; the HTML is not.
 *
 *   node scripts/parse-google-reviews.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const HTML =
  'Dandeli taxi service, Haliyal - Dandeli Rd, 3No Gate, Alur, Karnataka 581325 - Google Search - more expanded.html';

const RESORT_NAMES =
  /\b(jungle[-\s]?edge|ranjith|old magazine|kali adventure|bison resort)\b/i;

const html = readFileSync(HTML, 'utf8');

function clean(raw) {
  let t = raw.replace(/<br\s*\/?>/gi, '\n');
  t = t.replace(/<[^>]+>/g, '');
  t = t
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
  return t
    .replace(/[ \t]+/g, ' ')
    .replace(/\n +/g, '\n')
    .trim();
}

/** @type {Map<string, { id: string, author: string, dateLabel: string, text: string }>} */
const byId = new Map();

const cardRe = /data-review-id="([^"]+)"([\s\S]*?)(?=data-review-id="|$)/g;
let m;
while ((m = cardRe.exec(html))) {
  const id = m[1];
  const chunk = m[2];
  const author = chunk.match(/aria-label="Review options for review by ([^"]+)"/)?.[1];
  const dateLabel = chunk.match(/class="m6Mr5d">([^<]+)</)?.[1];
  const full = chunk.match(/class="gbdaZe"><div class="d83Iyc">([\s\S]*?)<\/div>/);
  const short = chunk.match(/class="d83Iyc">([\s\S]*?)<\/div>/);
  let text = '';
  if (full) text = clean(full[1]);
  else if (short && !short[1].includes('FrlmTe') && !short[1].includes('Read more'))
    text = clean(short[1]);
  else if (short && short[1].includes('Read more')) continue;
  else if (short) text = clean(short[1]);
  if (!text || text.length < 8) continue;
  if (RESORT_NAMES.test(text)) continue;
  byId.set(id, {
    id,
    author: author ?? 'Unknown',
    dateLabel: dateLabel ?? '',
    text,
  });
}

const reviews = [...byId.values()];

const TOPICS = {
  rafting: /\b(raft|rapids|ganeshgudi|supa)\b/i,
  safari: /\b(safari|tiger|panther|reserve|5:15|5\.15|morning slot)\b/i,
  routesHub: /\b(airport|station|junction|pickup|transfer|cab|taxi|driver)\b/i,
  'hubballi-airport': /\b(hubli|hubballi|hbx|airport)\b/i,
  'alnavar-junction': /\b(alnavar|alnnavar)\b/i,
  'londa-junction': /\b(londa)\b/i,
  'dabolim-goa': /\b(goa|dabolim|goi)\b/i,
  'belagavi-airport': /\b(belgaum|belagavi|ixg)\b/i,
  stays: /\b(resort|stay|room|treehouse|homestay|camp)\b/i,
  'on-the-river': /\b(river|kali|water|rafting)\b/i,
};

/** Questions: sentences ending in ? from reviews, bucketed by topic key. */
const faqCandidates = {};
for (const key of Object.keys(TOPICS)) faqCandidates[key] = [];

for (const r of reviews) {
  const sentences = r.text.split(/(?<=[.!?])\s+|\n+/);
  for (const s of sentences) {
    const q = s.trim();
    if (!q.includes('?') || q.length < 12) continue;
    for (const [key, re] of Object.entries(TOPICS)) {
      if (re.test(r.text) || re.test(q)) {
        faqCandidates[key].push({ question: q, sourceAuthor: r.author });
      }
    }
  }
}

/** Quotes: reviews matching topic, longest-first, for mapping. */
const quoteCandidates = {};
for (const [key, re] of Object.entries(TOPICS)) {
  quoteCandidates[key] = reviews
    .filter((r) => re.test(r.text))
    .sort((a, b) => b.text.length - a.text.length)
    .slice(0, 8)
    .map((r) => ({
      author: r.author,
      dateLabel: r.dateLabel,
      text: r.text,
      pull:
        r.text.length > 180 ? r.text.slice(0, 160).replace(/\s+\S*$/, '…') : undefined,
    }));
}

const out = {
  parsedAt: new Date().toISOString().slice(0, 10),
  source: HTML,
  reviewCount: reviews.length,
  reviews,
  faqCandidates,
  quoteCandidates,
};

writeFileSync('scripts/reviews-research.json', JSON.stringify(out, null, 2));
console.log(`Wrote ${reviews.length} reviews to scripts/reviews-research.json`);
