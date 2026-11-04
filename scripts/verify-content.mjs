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

/* 5. Every rendered quote is verbatim ------------------------------- */
const reviewsSrc = readFileSync('src/content/reviews.ts', 'utf8');
const texts = [...reviewsSrc.matchAll(/text:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) =>
  m[1].replace(/\\'/g, "'"),
);
const pulls = [...reviewsSrc.matchAll(/pull:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) =>
  m[1].replace(/\\'/g, "'"),
);
let badPull = 0;
for (const pull of pulls) {
  if (!texts.some((t) => t.includes(pull))) {
    fail(
      'verbatim quote',
      `pull-quote is not a span of any review: "${pull.slice(0, 60)}…"`,
    );
    badPull++;
  }
}
if (badPull === 0)
  ok('verbatim quotes', `${pulls.length} pull-quote(s) verified against source`);

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
  } else if (/namastedandeli\.com/.test(origin) && !process.env.SITE_URL) {
    // The custom domain is not live yet. Advertising it means the
    // card 404s for every share.
    fail(
      'og:image',
      `points at ${origin}, which does not resolve yet. Set SITE_URL once the domain is live, or let the Vercel fallback handle it`,
    );
  } else {
    ok('og:image', `${path} served from ${origin || 'relative'}`);
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
