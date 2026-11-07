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

/* 3b. Every <script> in the page is one we meant to ship -------------
   "No .js files in dist/" was the whole gate, and it stopped being the
   whole truth the moment analytics landed: a third-party tag is never
   written to dist/, so it passes the check above while adding 150KB to
   the page. The count was honest about what it measured and silent
   about what it did not.

   So the gate now also audits the script tags themselves. Each one must
   be ACCOUNTED FOR by name:

     - application/ld+json   the structured data (not executable)
     - the Motion IIFE       the site's own 2.5KB, recognised by a
                             distinctive string rather than by position
     - the Google tag        only when an ID is configured: the
                             googletagmanager src plus the inline
                             dataLayer/window.track snippet

   Anything else — a bundled island, a second analytics vendor pasted
   into a component instead of added to window.track, a stray inline
   handler — fails here rather than being discovered in the field. */
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
const unaccounted = [];
for (const [, attrs, body] of scripts) {
  const isJsonLd = /type\s*=\s*["']application\/ld\+json["']/i.test(attrs);
  const isMotion = body.includes('data-reveal-ready');
  const isGtagSrc = /googletagmanager\.com\/gtag\/js/i.test(attrs);
  const isGtagInline = body.includes('window.dataLayer') && body.includes('window.track');
  if (isJsonLd || isMotion || isGtagSrc || isGtagInline) continue;
  const where = attrs.trim() || body.trim().slice(0, 60);
  unaccounted.push(where.replace(/\s+/g, ' ').slice(0, 80));
}
if (unaccounted.length > 0) {
  fail(
    'script audit',
    `${unaccounted.length} unaccounted <script>: ${unaccounted.join(' | ')}`,
  );
} else {
  ok('script audit', `${scripts.length} script tag(s), all accounted for`);
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

/* 8. Legal pages: the footer link and the built page must agree -----
   The publish gate for a legal page is its BODY, not a Confirmed<T>:
   an empty body means the page does not exist, so no page is built and
   no footer link points at it.

   Two independent readers decide that — getStaticPaths and
   Footer.astro — and this is the check that they agreed. The failure
   it prevents is the one this entire site exists to fix: his Google
   listing's website URL returns 404, and a footer advertising a link
   to a page that was never built would reproduce that exact defect
   inside the site meant to replace it.

   Read from the snapshot (what the build FETCHED) and from dist (what
   it EMITTED), never from a source file. Note the emitted path is
   legal/<slug>/index.html, a directory — `trailingSlash: 'never'` sets
   the URL shape, not the file layout. */
const legal = snapshot?.legalPages ?? [];
const legalHrefs = [
  ...new Set([...html.matchAll(/href="\/legal\/([a-z0-9-]+)"/g)].map((m) => m[1])),
];
const legalPath = (slug) => join(DIST, 'legal', slug, 'index.html');
const builtLegal = walk(DIST)
  .filter((f) => /legal\/[^/]+\/index\.html$/.test(f))
  .map((f) => f.replace(/.*legal\//, '').replace(/\/index\.html$/, ''));

if (legal.length === 0) {
  /* Legitimate before the pages are seeded — but the footer must then
     carry no legal link at all. */
  if (legalHrefs.length > 0) {
    fail(
      'legal pages',
      `the footer links to /legal/${legalHrefs.join(', /legal/')} but no legal ` +
        'page is published — that is a link to a 404, the exact defect this ' +
        'site was built to fix',
    );
  } else {
    note('legal pages', 'none published yet — no footer link, as intended');
  }
} else {
  let bad = 0;

  /* 8a. Every published page was actually BUILT. */
  for (const p of legal) {
    if (!builtLegal.includes(p.slug)) {
      fail(
        'legal pages',
        `"${p.title}" is published but dist/legal/${p.slug}/ was not built`,
      );
      bad++;
    }
  }

  /* 8b. Every built page is LINKED from the footer. An orphan legal
         page is unreachable, which for a privacy policy is the same as
         not having one. */
  for (const slug of builtLegal) {
    if (!legalHrefs.includes(slug)) {
      fail(
        'legal pages',
        `dist/legal/${slug}/ was built but nothing in the footer links to it`,
      );
      bad++;
    }
  }

  for (const slug of builtLegal) {
    const page = readFileSync(legalPath(slug), 'utf8');
    const main = page.slice(page.indexOf('<main'), page.indexOf('</main>'));
    const text = main
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    /* 8c. The publish gate itself: a built page must carry real prose.
           An empty body is filtered at the adapter, so reaching here
           means that filter was weakened or bypassed. */
    if (text.length < 400) {
      fail(
        'legal pages',
        `dist/legal/${slug}/ has only ${text.length} characters of text — an ` +
          'empty or stub legal page must not be built at all',
      );
      bad++;
    }

    /* 8d. Exactly one <h1>. The title is the only h1; every editor
           heading is shifted one level down. A second h1 means that
           shift regressed, which flattens the outline for screen
           readers and for the AI agents now reading this page —
           silently, because it looks identical. */
    const h1s = (page.match(/<h1[\s>]/g) ?? []).length;
    if (h1s !== 1) {
      fail(
        'legal pages',
        `dist/legal/${slug}/ has ${h1s} <h1> element(s), expected exactly 1 — ` +
          'the editor-heading shift (h1->h2) in LegalBody.astro has regressed',
      );
      bad++;
    }

    /* 8e. No dead link. A legal page whose link mark lost its href
           renders <a href="#">, which is how this very page shipped
           once: the renderer read node.href instead of node.markDef
           .href, and every link silently became a no-op. */
    if (/<a href="#"/.test(main)) {
      fail(
        'legal pages',
        `dist/legal/${slug}/ contains <a href="#"> — a link annotation lost ` +
          'its href (read node.markDef.href, not node.href)',
      );
      bad++;
    }

    /* 8f. No partner resort named. Naming one is the single thing that
           costs Irshad money, and a legal page is where a drafter is
           most tempted to write a real name into a clause. */
    if (FORBIDDEN.test(text)) {
      fail(
        'legal pages',
        `dist/legal/${slug}/ names a partner resort — never name one; a named ` +
          'resort gets booked direct and Irshad loses the introduction he made',
      );
      bad++;
    }

    /* 8g. Contact details are READ from Sanity, never retyped. A terms
           document with a hardcoded number is the one place on the site
           that would still claim an old number after he changed it in
           the Studio. */
    const known = ['phone', 'phoneDisplay', 'email']
      .map((f) => String(snapshot?.site?.[f] ?? '').replace(/\s+/g, ''))
      .filter(Boolean);
    for (const m of text.matchAll(/\+91[\s\d]{8,}/g)) {
      const found = m[0].replace(/\s+/g, '');
      if (!known.some((k) => k === found || k.endsWith(found) || found.endsWith(k))) {
        fail(
          'legal pages',
          `dist/legal/${slug}/ prints ${m[0].trim()}, which is not ` +
            'siteSettings.phone — read it from the content adapter, never retype it',
        );
        bad++;
      }
    }
  }

  if (bad === 0) {
    ok(
      'legal pages',
      `${legal.length} published, built, linked and single-h1: ` +
        legal.map((p) => p.slug).join(', '),
    );
  }
}

/* 9. The footer carries its own dark band on every page ------------
   Every colour inside the footer is an opacity of `primary-foreground`
   — white — because it was written inside Contact's
   `bg-primary-deep text-primary-foreground` section and silently
   inherited both. Extracted and rendered bare on a legal page it kept
   the white text and lost the dark ground: white on warm paper, about
   1.1:1. The footer was fully present in the DOM, passed every gate
   including verify:aria, and was invisible on screen.

   No contrast checker catches that, because verify:a11y reads TOKEN
   PAIRS from global.css and cannot know which ground an element
   actually lands on. So the invariant is asserted structurally
   instead: the <footer> must name its own background. */
for (const f of walk(DIST).filter((f) => f.endsWith('.html'))) {
  const page = readFileSync(f, 'utf8');
  const tag = page.match(/<footer[^>]*>/);
  if (!tag) continue;
  if (!/bg-primary-deep/.test(tag[0])) {
    fail(
      'footer band',
      `${f} renders a <footer> that does not set its own background — every ` +
        'colour in it is white, so without bg-primary-deep it is white-on-paper ' +
        'and invisible. The band belongs to the footer, not to its wrapper.',
    );
  }
}
if (!failures.some((f) => f.startsWith('footer band'))) {
  ok('footer band', 'every footer sets its own dark ground');
}

/* 10. BAND mirrors @theme, and every dark band has a river edge -----
   src/styles/bands.ts carries the four band colours as hex, because an
   SVG `fill` cannot read a CSS custom property — so the divider needs
   a literal. That makes it a SECOND copy of four @theme tokens, and a
   second copy drifts: change `--color-primary-deep` in global.css and
   every divider would keep painting the old value against the new
   band. A seam, with nothing failing.

   So the two are compared here. The hex literals in bands.ts are the
   point of the file, not a smell — this check is what licenses them. */
const bandsSrc = readFileSync('src/styles/bands.ts', 'utf8');
const themeSrc = readFileSync('src/styles/global.css', 'utf8');
const THEME_OF = {
  bg: 'background',
  muted: 'muted',
  primary: 'primary',
  deep: 'primary-deep',
};
let drift = 0;
for (const [band, token] of Object.entries(THEME_OF)) {
  const inBand = bandsSrc.match(new RegExp(`${band}:\\s*'(#[0-9A-Fa-f]{6})'`));
  const inTheme = themeSrc.match(new RegExp(`--color-${token}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!inBand || !inTheme) {
    fail('band tokens', `could not read ${band} / --color-${token}`);
    drift++;
  } else if (inBand[1].toLowerCase() !== inTheme[1].toLowerCase()) {
    fail(
      'band tokens',
      `BAND.${band} is ${inBand[1]} but --color-${token} is ${inTheme[1]} — ` +
        'every divider would paint the old colour against the new band',
    );
    drift++;
  }
}
if (drift === 0) ok('band tokens', 'bands.ts matches @theme');

/* Every light<->dark edge is a river bend, never a straight cut. The
   house style's one hard "no" — see docs/style-guide.md. A page that
   puts a light section directly against a dark one ships a hard
   horizontal line, which is how both legal pages first shipped. */
const DARK = ['#082219', '#0F3D2E'];
let cuts = 0;
for (const f of walk(DIST).filter((f) => f.endsWith('.html'))) {
  if (/\/(og|styleguide)\//.test(f)) continue;
  const page = readFileSync(f, 'utf8');
  /* A divider immediately precedes each dark band it introduces, so
     count both: every dark section start should have one nearby. */
  const darkStarts = DARK.flatMap((c) => [
    ...page.matchAll(new RegExp(`background:${c}`, 'gi')),
  ]).length;
  const bends = (page.match(/viewBox="0 0 1440 90"/g) ?? []).length;
  if (darkStarts > 0 && bends === 0) {
    fail(
      'river edges',
      `${f} has a dark band but no <RiverDivider> — a light/dark edge must be ` +
        'a river bend, never a straight cut',
    );
    cuts++;
  }
}
if (cuts === 0) ok('river edges', 'every page with a dark band has a bend');

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
