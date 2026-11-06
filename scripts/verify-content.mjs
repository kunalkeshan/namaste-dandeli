/**
 * CONTENT TRUTH VALIDATORS
 *
 * The project-specific checks that protect Irshad. Each one exists
 * because the failure it catches has already happened at least once
 * in this repo:
 *
 *  - verbatim quotes     Routes.astro hardcoded a review as a string
 *                        literal, bypassing the build guard
 *  - unconfirmed facts   an unconfirmed "24 hours, every day" rendered
 *                        on the live page behind a flag nobody read
 *  - aggregateRating     Google ignores self-reported ratings; adding
 *                        it renders nothing and risks a policy issue
 *  - brand red           red/green converge to ~1.25:1 under
 *                        protanopia, so red must stay inside the logo
 *  - zero JS             the whole performance argument rests on it
 *  - image URLs          hotlinked Commons images are a third-party
 *                        runtime dependency; a dead one is a hole
 *
 * Run against dist/ after a build. Exit 1 on any failure.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const failures = [];
const notes = [];

function fail(check, detail) {
  failures.push(`${check}: ${detail}`);
}
function ok(check, detail) {
  notes.push(`✓ ${check}${detail ? ` — ${detail}` : ''}`);
}
/** Reported, but not a failure — for a check that could not run. */
function note(check, detail) {
  notes.push(`· ${check}${detail ? ` — ${detail}` : ''}`);
}

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `pnpm build` first.');
  process.exit(1);
}
const html = readFileSync(join(DIST, 'index.html'), 'utf8');

/* 1. No aggregateRating in structured data -------------------------- */
if (html.includes('aggregateRating')) {
  fail(
    'aggregateRating',
    'found in the page — Google ignores self-reported ratings and renders nothing',
  );
} else {
  ok('aggregateRating', 'absent, as intended');
}

/* 2. Brand red appears only inside the logo ------------------------- */
const RED = /#C3160D/gi;
const redHits = html.match(RED) ?? [];
const uiRed = html.match(/\b(?:bg|text|border|ring|fill|stroke)-brand\b/g) ?? [];
if (uiRed.length > 0) {
  fail(
    'brand red',
    `used as a UI colour ${uiRed.length}×: ${[...new Set(uiRed)].join(', ')}`,
  );
} else if (redHits.length > 4) {
  fail('brand red', `appears ${redHits.length}× — expected only inside the logo SVG`);
} else {
  ok('brand red', `${redHits.length} occurrence(s), logo only`);
}

/* 3. Zero separate JS files ----------------------------------------- */
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const jsFiles = walk(DIST).filter((f) => f.endsWith('.js'));
if (jsFiles.length > 0) {
  fail('zero JS', `${jsFiles.length} .js file(s) shipped: ${jsFiles.join(', ')}`);
} else {
  ok('zero JS', 'no separate .js files');
}

/* 4. No unconfirmed claim leaked into the page ---------------------- */
const MUST_NOT_RENDER = [
  ['24 hours, every day', 'the unconfirmed 24/7 hours claim'],
  ['Not a rotating pool', 'an unconfirmed assurance about who drives'],
  ['He will send the vehicle number', 'an unconfirmed assurance about pickup'],
];
let leaked = 0;
for (const [needle, what] of MUST_NOT_RENDER) {
  if (html.includes(needle)) {
    fail('unconfirmed fact', `${what} is rendering`);
    leaked++;
  }
}
if (leaked === 0) ok('unconfirmed facts', 'none leaked into the page');

/* 5. Every rendered quote is verbatim -------------------------------
   REWRITTEN for Sanity.

   The old version regexed src/content/reviews.ts as TEXT. Once reviews
   moved to the CMS that file stopped being what renders — the check
   would either read a stale file (passing while the page showed
   something else) or, when the file is deleted, find zero pull-quotes
   and pass VACUOUSLY. A gate that cannot fail is not a gate.

   Now it validates the content the build actually fetched, plus every
   blockquote in the shipped HTML — which also closes the original bug
   this check was written for: Routes.astro hardcoding a review as a
   string literal, bypassing the data entirely. */
const SNAPSHOT = '.astro/content-snapshot.json';
let snapshot;
try {
  snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
} catch {
  fail('verbatim quote', `${SNAPSHOT} is missing — run \`pnpm build\` first`);
  snapshot = { reviews: [] };
}

if (!snapshot.reviews?.length) {
  fail(
    'verbatim quote',
    'no reviews in the content snapshot — the check would pass vacuously',
  );
} else {
  let badPull = 0;
  for (const r of snapshot.reviews) {
    if (r.pull && !r.text.includes(r.pull)) {
      fail(
        'verbatim quote',
        `${r.author}: pull-quote is not a contiguous span of the review`,
      );
      badPull++;
    }
  }

  /* Any long quotation on the page must come from a real review. */
  const decode = (t) =>
    t
      .replace(/&#8217;|&rsquo;|&lsquo;|&#39;/g, "'")
      .replace(/&ldquo;|&rdquo;|&quot;|&#34;/g, '"')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
  const quoted = [...html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g)]
    .map((m) =>
      decode(m[1].replace(/<[^>]+>/g, ''))
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^["']+|["']+$/g, ''),
    )
    .filter((q) => q.length > 40);
  for (const q of quoted) {
    if (!snapshot.reviews.some((r) => decode(r.text).includes(q))) {
      fail(
        'verbatim quote',
        `a rendered blockquote is not a span of any review: "${q.slice(0, 60)}…"`,
      );
      badPull++;
    }
  }

  if (badPull === 0) {
    const pulls = snapshot.reviews.filter((r) => r.pull).length;
    ok(
      'verbatim quotes',
      `${pulls} pull-quote(s) and ${quoted.length} rendered quote(s) verified`,
    );
  }
}

/* 5b. Nothing excluded for provenance may reach the page ------------
   Thirteen of Irshad's photographs were deliberately never uploaded:
   seven screenshots watermarked with a named partner resort, one
   credited to a third party, three stock promo graphics, one showing a
   child, one unusable crop. If an asset URL for any of them appears,
   someone re-uploaded it. */
const FORBIDDEN = /jungle[-\s]?edge|ranjith|screenshot/i;
const assetUrls = [...html.matchAll(/cdn\.sanity\.io\/images\/[^"'\s]+/g)].map(
  (m) => m[0],
);
const badAsset = assetUrls.filter((u) => FORBIDDEN.test(u));
if (badAsset.length) {
  fail(
    'image provenance',
    `${badAsset.length} excluded asset(s) rendering: ${badAsset[0]}`,
  );
} else {
  ok(
    'image provenance',
    `${assetUrls.length} Sanity image(s), none from the excluded set`,
  );
}

/* 6. The forest texture stays faint --------------------------------
   The token-level a11y check cannot see a texture, because a texture
   is not a token. Measured on the rendered page, white text over the
   brightest texture stroke is 10.47:1 — against 12.16:1 on the bare
   band, so the texture costs 1.7 points. Opacity above ~0.07 starts
   eating into that margin. */
const texMatches = [
  ...readFileSync('src/components/ForestTexture.astro', 'utf8').matchAll(
    /opacity\s*=\s*([0-9.]+)/g,
  ),
].map((m) => parseFloat(m[1]));
const texUses = [...html.matchAll(/opacity:([0-9.]+)/g)]
  .map((m) => parseFloat(m[1]))
  .filter((o) => o > 0 && o < 0.2);
const tooStrong = [...texMatches, ...texUses].filter((o) => o > 0.07);
if (tooStrong.length) {
  fail(
    'forest texture',
    `opacity ${tooStrong.join(', ')} exceeds 0.07 — re-measure text contrast over the band`,
  );
} else {
  ok('forest texture', `faint (max ${Math.max(...texMatches, ...texUses, 0)})`);
}

/* 7. og:image must point at a file that actually exists -----------
   This check previously only asserted the file was on disk, which
   passed locally while production advertised og:image at a domain
   that did not resolve — WhatsApp fetched it, 404'd, and fell back
   to the favicon. Now it also checks that the declared ORIGIN is one
   this build can satisfy. */
const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
if (!ogMatch) {
  fail('og:image', 'not declared — social shares will fall back to the favicon');
} else {
  const url = ogMatch[1];
  const path = url.replace(/^https?:\/\/[^/]+/, '');
  const origin = url.slice(0, url.length - path.length);

  if (!existsSync(join(DIST, path))) {
    fail('og:image', `declared as ${url} but ${path} is not in dist/`);
  } else if (
    origin &&
    !process.env.SITE_URL &&
    !process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    !process.env.VERCEL_URL &&
    !/^https?:\/\/localhost/.test(origin)
  ) {
    /* A non-localhost origin on a build where no deployment variable
       was set means `site` came from a hardcoded guess. That is what
       shipped a dead og:image URL to production. Checking for the
       absence of a real source beats checking for one bad hostname:
       the hostname check would turn into a false failure the moment
       the domain is actually attached. */
    fail(
      'og:image',
      `points at ${origin}, but no SITE_URL or Vercel deployment variable was set — this origin is a hardcoded guess and may not resolve`,
    );
  } else {
    ok('og:image', `${path} served from ${origin || 'relative'}`);
  }
}

/* 7b. the OG raster must still agree with the content --------------
   og.astro reads five Sanity-controlled strings, but what ships is a
   SCREENSHOT of it. Change the review count or the subtitle in the
   Studio and the JPEG silently disagrees with the site — the card in
   every WhatsApp share says one thing, the page says another, and
   nothing reports it.

   render-og.mjs stamps public/og.meta.json with the text it baked
   in; this compares that against the live values. The whole point of
   "160+" is that the count can grow without a re-render, so only the
   rendered STRING is compared, never the underlying number. */
const OG_META = 'scripts/og.meta.json';
if (!existsSync(OG_META)) {
  note(
    'og freshness',
    'scripts/og.meta.json missing — run `pnpm og` so staleness can be detected',
  );
} else if (!snapshot.site) {
  note('og freshness', 'no site in the content snapshot — cannot compare');
} else {
  /* Compared case-insensitively: the .decal class sets
     text-transform:uppercase, so innerText reports "NAMASTE DANDELI"
     for content that reads "Namaste Dandeli". Casing is a styling
     concern here, not a content difference. */
  const baked = (JSON.parse(readFileSync(OG_META, 'utf8')).text ?? '').toLowerCase();
  const s = snapshot.site;
  const expect = [
    s.seo?.ogTitle,
    s.seo?.ogSubtitle?.replace(/\s+/g, ' ').trim(),
    `${s.google?.rating}`,
    `${s.google?.reviewCountLabel} Google reviews`,
    s.seo?.ogPlace,
  ].filter(Boolean);

  const missing = expect.filter((e) => !baked.includes(e.toLowerCase()));
  if (missing.length) {
    fail(
      'og freshness',
      `public/og.jpg was rendered from different content — it is missing ` +
        `${missing.map((m) => `"${m}"`).join(', ')}. Re-run \`pnpm og\`.`,
    );
  } else {
    ok('og freshness', 'the raster matches the live content');
  }
}

const jsonLdImage = html.match(/"image"\s*:\s*"([^"]+)"/);
if (jsonLdImage) {
  const p2 = jsonLdImage[1].replace(/^https?:\/\/[^/]+/, '');
  if (!existsSync(join(DIST, p2))) {
    fail('JSON-LD image', `references ${jsonLdImage[1]} which does not exist`);
  }
}

/* ------------------------------------------------------------------ */
console.log('\nContent checks\n');
for (const n of notes) console.log('  ' + n);
if (failures.length) {
  console.log('\n\x1b[31mFAILED\x1b[0m\n');
  for (const f of failures) console.log('  ✗ ' + f);
  console.log();
  process.exit(1);
}
console.log('\n\x1b[32mAll content checks passed.\x1b[0m\n');
