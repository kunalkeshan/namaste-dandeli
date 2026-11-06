/**
 * Renders /og.astro to public/og.jpg at 1200×630.
 *
 *   pnpm og        — self-contained: serves dist/, launches a browser
 *   pnpm build     — runs this automatically via `postbuild`
 *
 * SELF-CONTAINED BY DESIGN. The previous version required the caller
 * to have a preview server AND a headless Chrome on :9222 already
 * running, which produced two silent corruptions:
 *
 *   1. A Chrome the user already had open held :9222, so the render
 *      went through THEIR profile and baked an extension toolbar into
 *      the card.
 *   2. The default port was the DEV server, whose injected dev
 *      toolbar is part of the page — clipping cannot remove it.
 *
 * Both shipped a broken image into every WhatsApp and Facebook share
 * and neither was visible without opening the JPEG. So this script
 * now owns both halves: it serves dist/ itself on an ephemeral port
 * and launches its own browser. Nothing external to misconfigure.
 *
 * The browser is @sparticuz/chromium on Linux (Vercel's build
 * container has none) and the locally installed Chrome on macOS,
 * whose bundled binary is linux-x64 only.
 */
import { writeFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const DIST = 'dist';
/**
 * Written to BOTH trees, and the dist/ copy is the one that matters.
 *
 * Astro copies public/ into dist/ during the build, so a render that
 * runs after the build — which it must, since it screenshots the
 * built page — lands in public/ too late. dist/og.jpg would keep
 * whatever was there before, and Vercel deploys dist/. The public/
 * copy is what gets committed so the next build starts from the
 * right image; the dist/ copy is what actually ships.
 */
const OUT = ['public/og.jpg', join(DIST, 'og.jpg')];
const META = 'scripts/og.meta.json';
const WIDTH = 1200;
const HEIGHT = 630;

if (!existsSync(join(DIST, 'og', 'index.html'))) {
  console.error(`${DIST}/og/index.html not found — run \`pnpm build\` first.`);
  process.exit(1);
}

/* ---- serve dist/ on an ephemeral port ----------------------------- */
const TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  /* Resolve inside dist/ only — a static server that can be walked out
     of with ../ is a liability even in a build script. */
  const root = resolve(DIST);
  let file = resolve(join(root, url));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    /* Astro builds /og as /og/index.html; `cleanUrls` serves it at /og. */
    const alt = `${file}/index.html`;
    if (existsSync(alt)) file = alt;
    else {
      res.writeHead(404).end();
      return;
    }
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
  });
  res.end(readFileSync(file));
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const PORT = server.address().port;

/* ---- launch a browser --------------------------------------------- */
/**
 * @sparticuz/chromium ships a linux-x64 binary, so it is the right
 * answer on Vercel and useless on a Mac. Locally we point at the
 * installed Chrome instead. `CHROME_PATH` overrides both.
 */
async function executablePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  if (process.platform === 'linux') {
    const { default: chromium } = await import('@sparticuz/chromium');
    return chromium.executablePath();
  }
  const mac = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(mac)) return mac;
  throw new Error(
    'No Chrome found. Install Google Chrome or set CHROME_PATH to a binary.',
  );
}

let browser;
try {
  const linux = process.platform === 'linux';
  const { default: chromium } = linux
    ? await import('@sparticuz/chromium')
    : { default: null };

  browser = await puppeteer.launch({
    executablePath: await executablePath(),
    /* A fresh profile every run: no extensions, no infobars, no
       leftover state from the user's own browser. */
    args: linux
      ? chromium.args
      : ['--no-sandbox', '--disable-extensions', '--hide-scrollbars'],
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    headless: true,
  });

  const page = await browser.newPage();
  const url = `http://127.0.0.1:${PORT}/og`;

  /* networkidle0 replaces the old fixed 4s sleep: it waits for the
     remote hero image and the webfonts to actually finish, rather
     than guessing at a duration that is either flaky or wasteful. */
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60_000 });
  await page.evaluate(() => document.fonts.ready);

  const el = await page.$('#og');
  if (!el) throw new Error('No #og element on /og — did the page render?');

  const box = await el.boundingBox();
  if (Math.round(box.width) !== WIDTH || Math.round(box.height) !== HEIGHT) {
    throw new Error(
      `#og is ${Math.round(box.width)}×${Math.round(box.height)}, expected ${WIDTH}×${HEIGHT}.`,
    );
  }

  /* Clip to the element, so nothing the browser draws over the page
     can end up inside the card. */
  const buf = await el.screenshot({ type: 'jpeg', quality: 90 });
  for (const f of OUT) writeFileSync(f, buf);

  /**
   * Record WHAT was baked into the raster.
   *
   * og.astro reads five Sanity-controlled strings, but the card that
   * ships is a screenshot — so an editor changing the review count or
   * the subtitle in the Studio leaves a JPEG that disagrees with the
   * site, and nothing anywhere says so. verify-content.mjs compares
   * this stamp against the live content, turning a silent divergence
   * into a failed build.
   *
   * Same reasoning as the content snapshot: check what SHIPPED, not
   * what the source says it should be.
   */
  const text = await page.$eval('#og', (n) => n.innerText.replace(/\s+/g, ' ').trim());
  writeFileSync(
    META,
    JSON.stringify({ renderedAt: new Date().toISOString(), text }, null, 2) + '\n',
  );

  console.log(`✓ wrote ${OUT.join(' + ')} (${WIDTH}×${HEIGHT})`);
  console.log(`✓ wrote ${META} (what the raster says)`);
} catch (err) {
  /**
   * On a deploy, a failed card must not fail the SITE.
   *
   * This runs inside `pnpm build`, so throwing here would take the
   * whole Vercel deployment down — trading a stale social preview
   * for an outage, which is a far worse failure. The committed
   * og.jpg is still there and still valid; it is merely not refreshed.
   *
   * Locally the opposite is right: `pnpm og` exiting 0 after failing
   * would be a lie, and verify-content's freshness check is what
   * catches a stale raster before it is pushed.
   */
  const onCI = !!process.env.VERCEL || !!process.env.CI;
  console.error(`✗ OG render failed: ${err.message}`);
  if (onCI) {
    console.error('  Continuing the build — the committed og.jpg still ships.');
  } else {
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  server.close();
}
