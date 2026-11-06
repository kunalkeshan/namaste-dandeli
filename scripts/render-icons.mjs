/**
 * Renders every raster icon from public/favicon.svg.
 *
 * ONE SOURCE. The favicon.ico and apple-touch-icon.png had drifted
 * into two different drawings: the .ico carried the solid white D the
 * SVG defines, while the touch icon had been generated from the thin
 * Logo.astro geometry and read as a hollow outline. At 180px that is
 * merely different; on a home screen it is a weaker mark.
 *
 * favicon.svg is the canonical raster source — not Logo.astro. Both
 * are traced from the same artwork by scripts/trace-logo.mjs, but the
 * icon is dilated 20px against the page's 5px: the D's hairline bowl
 * is about 1% of the mark's width, a third of a pixel at 32px, and it
 * simply vanishes at the sizes this script renders.
 *
 * Renders through headless Chrome so the SVG is rasterised by the
 * same engine that will display it. Launches its own browser; no
 * preview server and no manual --remote-debugging-port needed.
 *
 *   pnpm icons
 */
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9412;

/** Every raster the site serves, and why it exists. */
const TARGETS = [
  { file: 'public/apple-touch-icon.png', size: 180 }, // iOS home screen
  { file: 'public/icon.png', size: 512 }, // Android / PWA / manifest
  { file: 'public/icon-192.png', size: 192 }, // Android launcher
];

/** The .ico carries the small sizes browsers pick for a tab. */
const ICO_SIZES = [16, 32, 48];

const svg = readFileSync('public/favicon.svg', 'utf8');

const profile = mkdtempSync(join(tmpdir(), 'icons-'));
const chrome = spawn(
  CHROME,
  [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

const until = async (fn, ms = 20000) => {
  const start = Date.now();
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (Date.now() - start > ms) throw err;
      await new Promise((r) => setTimeout(r, 200));
    }
  }
};

const targets = await until(async () => {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const list = await res.json();
  if (!list.some((t) => t.type === 'page')) throw new Error('no page yet');
  return list;
});

const sock = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
sock.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    sock.send(JSON.stringify({ id: i, method, params }));
  });
await new Promise((r) => (sock.onopen = r));
await send('Page.enable');

/** Rasterises the SVG at one size, transparent outside its rounded corners. */
async function raster(size) {
  const html =
    `<!doctype html><meta charset="utf-8">` +
    `<style>html,body{margin:0;background:transparent}` +
    `svg{display:block;width:${size}px;height:${size}px}</style>` +
    svg;
  await send('Emulation.setDeviceMetricsOverride', {
    width: size,
    height: size,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 0, g: 0, b: 0, a: 0 },
  });
  await send('Page.navigate', {
    url: `data:text/html;base64,${Buffer.from(html).toString('base64')}`,
  });
  await new Promise((r) => setTimeout(r, 450));
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  return Buffer.from(data, 'base64');
}

for (const t of TARGETS) {
  writeFileSync(t.file, await raster(t.size));
  console.log(`  ✓ ${t.file}  ${t.size}×${t.size}`);
}

/* The .ico is a container: write each size as a PNG-compressed frame,
   which every browser since IE11 reads and which keeps the file small. */
const frames = [];
for (const s of ICO_SIZES) frames.push({ size: s, png: await raster(s) });

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2); // type 1 = icon
header.writeUInt16LE(frames.length, 4);

let offset = 6 + frames.length * 16;
const dirs = [];
for (const f of frames) {
  const d = Buffer.alloc(16);
  d.writeUInt8(f.size === 256 ? 0 : f.size, 0);
  d.writeUInt8(f.size === 256 ? 0 : f.size, 1);
  d.writeUInt8(0, 2); // palette
  d.writeUInt8(0, 3); // reserved
  d.writeUInt16LE(1, 4); // colour planes
  d.writeUInt16LE(32, 6); // bits per pixel
  d.writeUInt32LE(f.png.length, 8);
  d.writeUInt32LE(offset, 12);
  offset += f.png.length;
  dirs.push(d);
}
writeFileSync(
  'public/favicon.ico',
  Buffer.concat([header, ...dirs, ...frames.map((f) => f.png)]),
);
console.log(`  ✓ public/favicon.ico  ${ICO_SIZES.join(', ')}px frames`);

chrome.kill();
process.exit(0);
