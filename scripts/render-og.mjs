/**
 * Renders /og.astro to public/og.jpg at 1200×630.
 *
 * Run with the preview server up:  pnpm og
 */
import { writeFileSync } from 'node:fs';

const PORT = process.env.OG_PORT ?? 4321;
const ENDPOINT = `http://127.0.0.1:9222/json/list`;

const targets = await (await fetch(ENDPOINT)).json();
const page = targets.find((t) => t.type === 'page');
if (!page) {
  console.error('No headless Chrome page found on :9222');
  process.exit(1);
}

const sock = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    sock.send(JSON.stringify({ id: i, method, params }));
  });
sock.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
};
await new Promise((r) => (sock.onopen = r));

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 1200,
  height: 630,
  deviceScaleFactor: 1,
  mobile: false,
});
await send('Page.navigate', { url: `http://localhost:${PORT}/og` });
await new Promise((r) => setTimeout(r, 4000)); // fonts + remote hero image

const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
writeFileSync('public/og.jpg', Buffer.from(shot.data, 'base64'));
console.log('✓ wrote public/og.jpg (1200×630)');
process.exit(0);
