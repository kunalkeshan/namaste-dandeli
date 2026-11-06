/**
 * Rebuilds the monogram from the designer's original artwork.
 *
 * `source-logo.webp` is what Airsaat delivered: a 1588px greyscale
 * raster — black ink on white, no alpha, and no colour information at
 * all. Irshad's signboard is what says which letter is which colour:
 * the N (its calligraphic swash and its right upright) is red, the D
 * is white.
 *
 * Separating them needs no hand-tracing. Thresholding the ink and
 * labelling 4-connected components yields exactly five blobs:
 *
 *   N  the swash's upper-left tail, and the lower sweep — which is
 *      fused with the upright, because the swash passes through it
 *   D  the upper bowl, the hairline left bowl, and the stem
 *
 * Each group is traced to a single path, so every rendered logo
 * contributes exactly one `#C3160D` to the HTML — `verify-content`
 * counts them and fails above four.
 *
 * THE FIVE-COMPONENT GUARD. The red/white split is keyed to that
 * topology. If the source is ever re-exported and the shapes merge or
 * split, this script throws rather than emit a silently mis-coloured
 * mark — the failure mode that matters, because a wrong logo still
 * looks like a logo.
 *
 *   node scripts/trace-logo.mjs           # src/components/Logo.astro
 *   node scripts/trace-logo.mjs --icon    # public/favicon.svg
 *   node scripts/trace-logo.mjs --png     # transparent PNG deliverables
 *
 * Needs `potrace` (pure JS) and `sharp`, neither a project dependency:
 *
 *   npm_config_yes=1 npx --package=potrace --package=sharp node scripts/trace-logo.mjs
 */
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const potrace = require('potrace');

const SOURCE = 'source-logo.webp';
const ICON = process.argv.includes('--icon');
const PNG = process.argv.includes('--png');

/**
 * Dilation in source pixels before tracing.
 *
 * NOT zero, even for the page. The raster Airsaat exported is lighter
 * than the acrylic sign it was cut from. Measured as a share of the
 * mark's width, the sign runs:
 *
 *             sign    raw trace   at DILATE 5
 *   N upright 2.10%     0.89%        1.75%
 *   N swash   7.10%     6.39%        7.15%
 *   D stem    6.40%     5.89%        6.78%
 *
 * The upright — the straight line at the N's end — was the worst of
 * it at less than half the sign's weight, which read as spindly next
 * to the real thing. 5px closes the gap without flattening the
 * Didone thick/thin contrast, which 6px and above starts to do.
 *
 * The icon needs far more: see public/favicon.svg's comment.
 */
const DILATE = ICON ? 20 : 5;

if (!existsSync(SOURCE)) {
  throw new Error(`${SOURCE} not found — this is the designer's master artwork`);
}

/* WebP → PNG. `sharp` reads WebP directly, so no dwebp needed. */
const { data, info } = await sharp(SOURCE)
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width;
const H = info.height;
const C = info.channels;

/* Ink is dark; alpha is its inverse, so anti-aliased edges survive. */
const alpha = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) alpha[p] = 255 - data[p * C];
const ink = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) ink[p] = alpha[p] > 127 ? 1 : 0;

/* 4-connected labelling ------------------------------------------- */
const lab = new Int32Array(W * H).fill(-1);
const stack = new Int32Array(W * H);
const comps = [];
for (let seed = 0; seed < W * H; seed++) {
  if (!ink[seed] || lab[seed] >= 0) continue;
  const id = comps.length;
  let sp = 0;
  stack[sp++] = seed;
  lab[seed] = id;
  let count = 0;
  let minX = W,
    minY = H,
    maxX = -1,
    maxY = -1;
  while (sp > 0) {
    const q = stack[--sp];
    count++;
    const x = q % W;
    const y = (q / W) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (x > 0 && ink[q - 1] && lab[q - 1] < 0) {
      lab[q - 1] = id;
      stack[sp++] = q - 1;
    }
    if (x < W - 1 && ink[q + 1] && lab[q + 1] < 0) {
      lab[q + 1] = id;
      stack[sp++] = q + 1;
    }
    if (y > 0 && ink[q - W] && lab[q - W] < 0) {
      lab[q - W] = id;
      stack[sp++] = q - W;
    }
    if (y < H - 1 && ink[q + W] && lab[q + W] < 0) {
      lab[q + W] = id;
      stack[sp++] = q + W;
    }
  }
  comps.push({ id, count, minX, minY, maxX, maxY });
}

if (comps.length !== 5) {
  throw new Error(
    `expected 5 components in ${SOURCE}, found ${comps.length}. ` +
      `The N/D colour split is keyed to that topology — re-derive it before trusting this output.`,
  );
}

/* Identify the N by geometry, not by index: its tail reaches furthest
   up-and-left, and its lower sweep is the widest shape in the mark.
   Index order would silently flip the colours if labelling changed. */
const topLeft = comps.reduce((a, b) => (a.minX + a.minY <= b.minX + b.minY ? a : b));
const widest = comps.reduce((a, b) => (a.maxX - a.minX >= b.maxX - b.minX ? a : b));
const RED = new Set([topLeft.id, widest.id]);
if (RED.size !== 2) {
  throw new Error('could not identify the two N components by geometry');
}

/* Grow the labels outward into the anti-aliased fringe, so no edge
   pixel is left unassigned and the traced outline stays smooth. */
const seen = new Int32Array(W * H).fill(-1);
const queue = new Int32Array(W * H);
let head = 0;
let tail = 0;
for (let p = 0; p < W * H; p++)
  if (lab[p] >= 0) {
    seen[p] = 0;
    queue[tail++] = p;
  }
while (head < tail) {
  const p = queue[head++];
  const x = p % W;
  const y = (p / W) | 0;
  const nbrs = [
    x > 0 ? p - 1 : -1,
    x < W - 1 ? p + 1 : -1,
    y > 0 ? p - W : -1,
    y < H - 1 ? p + W : -1,
  ];
  for (const r of nbrs) {
    if (r < 0 || seen[r] >= 0 || alpha[r] === 0) continue;
    seen[r] = seen[p] + 1;
    lab[r] = lab[p];
    queue[tail++] = r;
  }
}

let orphans = 0;
for (let p = 0; p < W * H; p++) if (ink[p] && lab[p] < 0) orphans++;
if (orphans) throw new Error(`${orphans} ink pixels fell outside both colour groups`);

/* The tight square: the ink's bounding box, centred. */
const minX = Math.min(...comps.map((c) => c.minX));
const maxX = Math.max(...comps.map((c) => c.maxX));
const minY = Math.min(...comps.map((c) => c.minY));
const maxY = Math.max(...comps.map((c) => c.maxY));
const inkW = maxX - minX + 1;
const inkH = maxY - minY + 1;
const SIDE = Math.max(inkW, inkH);
const offX = minX - (SIDE - inkW) / 2;
const offY = minY - (SIDE - inkH) / 2;

function dilate(mask, radius) {
  let cur = mask;
  for (let pass = 0; pass < radius; pass++) {
    const next = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (
          cur[p] ||
          (x > 0 && cur[p - 1]) ||
          (x < W - 1 && cur[p + 1]) ||
          (y > 0 && cur[p - W]) ||
          (y < H - 1 && cur[p + W])
        )
          next[p] = 1;
      }
    }
    cur = next;
  }
  return cur;
}

const scratch = mkdtempSync(join(tmpdir(), 'logo-'));

async function maskFile(wantRed) {
  let mask = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    if (lab[p] >= 0 && RED.has(lab[p]) === wantRed && alpha[p] > 127) mask[p] = 1;
  }
  if (DILATE) mask = dilate(mask, DILATE);
  const buf = Buffer.alloc(W * H, 255);
  for (let p = 0; p < W * H; p++) if (mask[p]) buf[p] = 0;
  const file = join(scratch, wantRed ? 'n.png' : 'd.png');
  await sharp(buf, { raw: { width: W, height: H, channels: 1 } })
    .png()
    .toFile(file);
  return file;
}

const trace = (file) =>
  new Promise((resolve, reject) => {
    const t = new potrace.Potrace({
      turdSize: 2,
      alphaMax: 1.0,
      optCurve: true,
      optTolerance: 0.2,
      threshold: 128,
    });
    t.loadImage(file, (err) =>
      err ? reject(err) : resolve(t.getPathTag().match(/ d="([^"]*)"/)[1]),
    );
  });

/** potrace emits absolute source coordinates; shift into the square. */
const shift = (d) =>
  d.replace(
    /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,
    (_, x, y) => `${+(+x - offX).toFixed(1)} ${+(+y - offY).toFixed(1)}`,
  );

const nPath = shift(await trace(await maskFile(true)));
const dPath = shift(await trace(await maskFile(false)));

console.log(`source ${W}×${H}, ink ${inkW}×${inkH} → square ${SIDE}`);
console.log(`N = components ${[...RED].join(', ')}; dilation ${DILATE}px`);

if (PNG) {
  /* Deliverables for off-site use: the Google Business Profile logo,
     WhatsApp, letterheads. Two variants, because a white D is
     invisible on paper and a dark D is invisible on the signboard. */
  const render = async (dFill, out) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIDE} ${SIDE}">
<g fill="#C3160D"><path d="${nPath}"/></g>
<g fill="${dFill}"><path d="${dPath}"/></g></svg>`;
    await sharp(Buffer.from(svg), { density: 300 })
      .resize(1588, 1588, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    console.log(`  ✓ ${out}`);
  };
  await render('#FFFFFF', 'namaste-dandeli-logo-on-dark.png');
  await render('#0F3D2E', 'namaste-dandeli-logo-on-light.png');
} else {
  console.log('\nN path:\n' + nPath + '\n\nD path:\n' + dPath);
}
