/**
 * ARIA VALIDATORS
 *
 * Reads the BUILT HTML in dist/, not the .astro sources, so the check
 * sees what actually ships — the same reason verify-content.mjs reads
 * the content snapshot rather than re-reading a source module.
 *
 * Why this file exists: Lighthouse's "Accessibility tree is not
 * well-formed" audit failed on the live site with
 *
 *     Elements must only use permitted ARIA attributes
 *     → div.text-accent-bright
 *
 * which was a review's star rating written as
 *
 *     <div aria-label="5 out of 5 stars">
 *       <span aria-hidden="true">★★★★★</span>
 *     </div>
 *
 * A bare <div> has NO implicit ARIA role, and aria-label is only
 * permitted on an element that has one. So the label was discarded,
 * the stars were hidden, and the rating was announced as nothing at
 * all — invisible to screen readers and to the AI agents that now
 * read this page. verify-a11y.mjs only ever checked colour contrast,
 * so nothing caught it.
 *
 * Four rules, each written after a real defect:
 *
 *  1. aria-label/labelledby on a roleless generic element. The bug
 *     above. The label is silently dropped.
 *  2. aria-hidden children inside role="list". A list must own its
 *     listitems; hiding half of them breaks that ownership, which is
 *     the literal "not well-formed" complaint.
 *  3. aria-hidden on a focusable element. Produces a "phantom" stop:
 *     reachable by keyboard, announced as nothing.
 *  4. An element whose entire accessible name would be empty.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
if (!existsSync(DIST)) {
  console.error('dist/ not found — run `pnpm build` first.');
  process.exit(1);
}

/** Every .html in dist/, recursively. */
function htmlFiles(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

/**
 * Elements with NO implicit ARIA role. aria-label and
 * aria-labelledby are not permitted on these, and a conforming
 * browser drops them.
 *
 * <span> and <div> are the two that matter in practice. The others
 * are here because they are the usual reach-for alternatives and
 * behave identically.
 */
const ROLELESS = new Set(['div', 'span', 'p', 'b', 'i', 'em', 'strong', 'small']);

/** Tags that are focusable without a tabindex. */
const FOCUSABLE = /^(a|button|input|select|textarea|summary|details)$/;

const failures = [];
const notes = [];
let checked = 0;

for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, 'utf8');
  const where = file.replace(`${DIST}/`, '');

  /* --- 1. aria-label on a roleless generic ------------------------- */
  for (const m of html.matchAll(/<([a-z0-9]+)\b([^>]*)>/gi)) {
    const [, tag, attrs] = m;
    checked++;
    const t = tag.toLowerCase();
    const labelled = /\saria-(label|labelledby)\s*=/.test(attrs);
    const hasRole = /\srole\s*=/.test(attrs);

    if (labelled && ROLELESS.has(t) && !hasRole) {
      const cls = attrs.match(/class\s*=\s*"([^"]*)"/)?.[1] ?? '';
      const label = attrs.match(/aria-label\s*=\s*"([^"]*)"/)?.[1] ?? '';
      failures.push(
        `${where}: <${t}${cls ? ` class="${cls.split(/\s+/)[0]}"` : ''}> has ` +
          `aria-label="${label}" but no role — the label is DISCARDED. ` +
          'Use a real element, a role, or a .sr-only span of text.',
      );
    }

    /* --- 3. aria-hidden on something focusable --------------------- */
    const hidden = /\saria-hidden\s*=\s*"true"/.test(attrs);
    const tabbable =
      FOCUSABLE.test(t) && !/\stabindex\s*=\s*"-1"/.test(attrs) && t !== 'details';
    if (hidden && tabbable && /\shref\s*=|<(button|input|select|textarea)/i.test(m[0])) {
      failures.push(
        `${where}: <${t}> is aria-hidden but still focusable — a keyboard ` +
          'user lands on an element that announces nothing. Add tabindex="-1" ' +
          'or stop hiding it.',
      );
    }
  }

  /* --- 2. aria-hidden inside a role="list" ------------------------- */
  for (const m of html.matchAll(/<([a-z0-9]+)\b[^>]*\srole\s*=\s*"list"[^>]*>/gi)) {
    const start = m.index + m[0].length;
    /* The list's own subtree, bounded by its closing tag. Nested lists
       are not used on this page, so a non-greedy match is sufficient. */
    const close = html.indexOf(`</${m[1]}>`, start);
    const inner = html.slice(start, close === -1 ? start + 4000 : close);
    if (/\saria-hidden\s*=\s*"true"/.test(inner)) {
      failures.push(
        `${where}: a role="list" contains aria-hidden children. A list must ` +
          'own its listitems — hiding some breaks that ownership and is ' +
          'exactly what "accessibility tree is not well-formed" reports. ' +
          'Hide the whole decorative copy and expose one real <ul> instead.',
      );
    }
  }

  /* --- 4. links and buttons with no accessible name ---------------- */
  for (const m of html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, attrs, inner] = m;
    if (/\saria-(label|labelledby)\s*=\s*"[^"]+"/.test(attrs)) continue;
    if (/\saria-hidden\s*=\s*"true"/.test(attrs)) continue;
    /* Strip tags and anything explicitly hidden, then see what text is
       left for a screen reader to announce. */
    const visible = inner
      .replace(/<[^>]*aria-hidden\s*=\s*"true"[^>]*>[\s\S]*?<\/[a-z0-9]+>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z]+;/gi, ' ')
      .trim();
    if (!visible) {
      const href = attrs.match(/href\s*=\s*"([^"]*)"/)?.[1] ?? '';
      failures.push(
        `${where}: <${tag}${href ? ` href="${href}"` : ''}> has no accessible ` +
          'name — every glyph inside it is aria-hidden and there is no label.',
      );
    }
  }
}

/* --- report ------------------------------------------------------- */
console.log('\nARIA & accessibility tree\n');

const checks = [
  'aria-label on roleless generics — none',
  'role="list" ownership — intact',
  'aria-hidden on focusable elements — none',
  'accessible names on links and buttons — all present',
];

if (failures.length) {
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n\x1b[31m${failures.length} ARIA failure(s).\x1b[0m\n`);
  process.exit(1);
}

for (const c of checks) console.log(`  ✓ ${c}`);
for (const n of notes) console.log(`  · ${n}`);
console.log(`\n  ${checked} elements inspected across ${htmlFiles(DIST).length} page(s)`);
console.log('\n\x1b[32mAll ARIA checks passed.\x1b[0m\n');
