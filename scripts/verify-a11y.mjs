/**
 * ACCESSIBILITY VALIDATORS
 *
 * Reads the design tokens straight out of src/styles/global.css, so
 * the check cannot drift from what the site actually ships — a
 * hardcoded copy of the palette would pass while the real one broke.
 *
 * Covers two things a contrast checker alone misses:
 *  1. HOVER states. An accent hover once shipped at 3.61:1 because
 *     it lightened the button; hover needs contrast too.
 *  2. Colour-blind convergence. Every red/green pair here collapses
 *     to ~1.25:1 under protanopia, which is why brand red may never
 *     carry meaning on its own.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/global.css', 'utf8');

/* ---- read the tokens from source ---------------------------------- */
const tokens = {};
for (const m of css.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)) {
  tokens[m[1]] = m[2];
}
/* hover colours live inside the (hover:hover) block */
for (const m of css.matchAll(
  /\.btn-([a-z]+):hover\s*\{\s*background-color:\s*(#[0-9A-Fa-f]{6})/g,
)) {
  tokens[`${m[1]}-hover`] = m[2];
}

const need = [
  'background',
  'foreground',
  'muted',
  'muted-foreground',
  'primary',
  'primary-foreground',
  'primary-deep',
  'accent',
  'accent-ink',
  'accent-bright',
  'brand',
  'border',
];
const missing = need.filter((t) => !tokens[t]);
if (missing.length) {
  console.error(`Could not read tokens from global.css: ${missing.join(', ')}`);
  process.exit(1);
}

/* ---- colour maths -------------------------------------------------- */
const s2l = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => {
  const [r, g, b] = rgb(h).map(s2l);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const CVD = {
  protanopia: [
    [0.1121, 0.8853, -0.0005],
    [0.1127, 0.8897, -0.0001],
    [0.0045, 0, 1.0019],
  ],
  deuteranopia: [
    [0.292, 0.7054, -0.0003],
    [0.2934, 0.7089, 0],
    [-0.0195, 0.0333, 0.9912],
  ],
};
const l2s = (c) => {
  c = Math.max(0, Math.min(1, c));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
};
const hex = (v) =>
  '#' +
  v
    .map((c) =>
      Math.round(Math.max(0, Math.min(255, c * 255)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase();
const sim = (h, kind) => {
  const [r, g, b] = rgb(h).map(s2l),
    M = CVD[kind];
  return hex(M.map((row) => l2s(row[0] * r + row[1] * g + row[2] * b)));
};

/* ---- the pairs that must pass -------------------------------------- */
const TEXT = [
  ['body text', 'foreground', 'background', 4.5],
  ['secondary text', 'muted-foreground', 'background', 4.5],
  ['secondary on muted', 'muted-foreground', 'muted', 4.5],
  ['primary button', 'primary-foreground', 'primary', 4.5],
  ['primary button HOVER', 'primary-foreground', 'primary-hover', 4.5],
  ['accent button', 'primary-foreground', 'accent', 4.5],
  ['accent button HOVER', 'primary-foreground', 'accent-hover', 4.5],
  ['accent as link text', 'accent-ink', 'background', 4.5],
  ['text on hero', 'primary-foreground', 'primary-deep', 4.5],
  ['stars on dark', 'accent-bright', 'primary', 3],
  ['border on background', 'border', 'background', 3],
  ['border on muted', 'border', 'muted', 3],
];

const rows = [];
const failures = [];
for (const [name, fg, bg, min] of TEXT) {
  if (!tokens[fg] || !tokens[bg]) {
    failures.push(`${name}: token missing`);
    continue;
  }
  const r = ratio(tokens[fg], tokens[bg]);
  const pass = r >= min;
  rows.push([name, r, min, pass]);
  if (!pass) failures.push(`${name} is ${r.toFixed(2)}:1, needs ${min}:1`);
}

/* every text pair must also survive CVD */
for (const kind of ['protanopia', 'deuteranopia']) {
  for (const [name, fg, bg, min] of TEXT) {
    if (!tokens[fg] || !tokens[bg]) continue;
    const r = ratio(sim(tokens[fg], kind), sim(tokens[bg], kind));
    if (r < Math.min(min, 3)) failures.push(`${name} under ${kind}: ${r.toFixed(2)}:1`);
  }
}

console.log('\nContrast\n');
for (const [name, r, min, pass] of rows) {
  console.log(
    `  ${pass ? '✓' : '✗'} ${name.padEnd(24)} ${r.toFixed(2).padStart(6)}:1  (min ${min})`,
  );
}
const conv = ratio(sim(tokens.brand, 'protanopia'), sim(tokens.primary, 'protanopia'));
console.log(`\n  brand red vs primary green under protanopia: ${conv.toFixed(2)}:1`);
console.log(
  '  (they converge — which is why brand red must never carry meaning alone)\n',
);

if (failures.length) {
  console.log('\x1b[31mFAILED\x1b[0m\n');
  for (const f of failures) console.log('  ✗ ' + f);
  console.log();
  process.exit(1);
}
console.log('\x1b[32mAll contrast and colour-blindness checks passed.\x1b[0m\n');
