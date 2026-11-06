# CLAUDE.md — Guidance for AI Agents & Contributors (namaste-dandeli)

## Purpose

Architecture, conventions and domain context for the Namaste Dandeli website.
Execution rules and the Definition of Done live in [AGENTS.md](AGENTS.md).

## Project Overview

A single static page for **Irshad Khan**, who runs a cab and resort-booking business
from Alur on the Haliyal–Dandeli road in Karnataka. Three vehicles; two linked trades:
driving tourists around Dandeli and to/from airports and stations, and placing them
into resorts he has tie-ups with.

**Why the site exists:** he has 4.9★ from 160 Google reviews and a 100% owner-response
rate going back three years — and the website link on that listing returns **HTTP 404**.
Every searcher who taps "Website" lands on an error page. The site's first job is to
exist at a working URL.

**The argument it makes:** Irshad is the person who connects you to all of Dandeli —
the transport, the activities, and the stay. It earns the booking through his own
channels (call/WhatsApp) and **must not name partner resorts**, because a named resort
gets booked direct and he loses the introduction he made.

## Commands

```
pnpm dev              # dev server
pnpm build            # static build -> dist/
pnpm preview          # serve dist/

pnpm check            # format check + typecheck          (fast, pre-commit)
pnpm verify           # check + build + content + a11y + aria  (slow, pre-push)
pnpm verify:content   # content truth validators
pnpm verify:a11y      # contrast + colour-blindness
pnpm verify:aria      # ARIA & accessibility-tree validity
pnpm blockers         # every fact still waiting on Irshad
pnpm og               # regenerate og.jpg — self-contained; runs inside `pnpm build`
pnpm icons            # regenerate every raster icon from public/favicon.svg

pnpm dev:site         # Astro only, without the Studio
pnpm dev:studio       # Studio only (localhost:3333)
pnpm studio:deploy    # deploy the Studio to *.sanity.studio
```

## Stack

- **Astro 7**, static output, **zero client JavaScript**
- `astro-portabletext` renders the legal pages' rich text — Astro-native, no React.
  It ships UNBUILT source (its export map points at `lib/index.ts`), so it must stay
  in `vite.ssr.noExternal`; without that the build fails on an unparseable import
  inside `node_modules`.
- `@tailwindcss/typography` for legal prose, loaded CSS-first via `@plugin` in
  `global.css`, with every `--tw-prose-*` variable remapped to a project token
- **Tailwind 4** via `@tailwindcss/vite` — _not_ `@astrojs/tailwind`, which is the
  Tailwind-3 legacy path
- **pnpm**, Node ≥22.23.4 (`.nvmrc`)
- Deploys to **Vercel** (`vercel.json`); PR previews so Irshad can review real URLs

No React, no UI framework. The 2.5KB of JS in `Motion.astro` is inline and the page
renders fully without it.

## Architecture

```
src/
  content/      all facts and copy — the ONLY place either lives
    index.ts    the adapter: components import from here and nowhere else
    confirmed.ts  the Confirmed<T> guard (read this first)
  components/   one .astro file per section
  layouts/      page shell: head, fonts, JSON-LD
  styles/       design tokens (@theme) and base styles
  pages/
    index.astro      the site
    legal/[slug].astro  privacy policy + terms, from Sanity
    robots.txt.ts    generated, so the sitemap URL tracks the real host
    og.astro         the 1200×630 social card, rendered by `pnpm og`
scripts/        the gates: verify-content, verify-a11y, report-blockers, render-og
docs/           style guide, content rules, domain facts, SEO, launch runbook
```

### The content adapter

Components import from `src/content` and nowhere else. **Sanity has landed**:
`getContent()` is now a single GROQ query returning the same shapes, and no component
changed — which is what the async boundary was for.

`getContent()` memoizes the _promise_, so thirteen call sites cost one round trip.
`narrowConfirmed` (`src/content/narrow.ts`) rebuilds `Confirmed<T>` from the flat
object Sanity stores, omitting `value` entirely when unconfirmed. It fails closed —
which matters because **MCP writes skip Studio validation**, so the adapter, not the
Studio, is the real gate. See `docs/adr/002-sanity-adapter.md`.

The Studio is standalone in `studio/` with its own dependency tree. `pnpm dev` runs
both; `pnpm dev:site` runs only Astro.

This holds for copy as well as data: headings, ledes and nav labels live in
`content/copy.ts`, not in the components. They used to be hardcoded, which made the
promised Sanity swap aspirational.

### The Confirmed<T> guard — read this before touching `src/content`

```ts
type Confirmed<T> =
  | { confirmed: true; value: T; confirmedOn: string }
  | { confirmed: false; fallback: string; blocker: string };
```

An unconfirmed fact **has no `value` property**, so a component physically cannot
print the claim. This replaced three ad-hoc flags that had drifted: `routes.verified`
worked, while `site.hoursConfirmed` and `ownPhotos.ready` were dead — no component
read them, so an unconfirmed "24 hours, every day" rendered on the live page.

`blocker` is the question to put to Irshad. `pnpm blockers` generates the launch
checklist from these strings, so it cannot go stale.

## Domain facts

Verified and safe to publish (survived adversarial checking):

- **Kali Tiger Reserve** is the current official name (renamed from Dandeli–Anshi, 2015)
- Rafting is **Supa Dam water-release dependent, not rainfall dependent** — Oct–June
  per Karnataka Tourism, but never promise a date. _This honesty is a selling point._
- Rapids are **Grade II–III** (not IV); **Ganeshgudi** is the hub
- **Four of India's nine hornbill species**; ~270 bird species
- Kali is one of India's best-known **black panther** territories — never promise a sighting
- Syntheri Rocks is carved by the **Kaneri** river, not the Kali

**Rejected claims and the full do-not-publish list: `docs/dandeli-facts.md`.** Read it
before adding any Dandeli fact — several plausible-sounding figures in circulation are
wrong, and two were fabricated by research agents on this very project.

## AI Agent Guardrails

- **Never add `aggregateRating`** to the structured data. Google ignores self-reported
  ratings — it renders nothing. The 4.9 is shown as visible HTML instead, which is both
  allowed and what converts. (`docs/seo.md`)
- **Never edit a customer review's text.** "confortable", "Susuki", "bcos" are how
  those customers wrote. An edited testimonial is a fabricated one.
- **Never publish an unmeasured number.** Distances and prices render only through the
  guard. A wrong drive time means a customer misses a flight.
- **Never use brand red (`--color-brand`) as a UI colour.** It converges with the
  primary green to 1.25:1 under protanopia; it is safe only because it appears
  exactly twice, both inside the logo SVG.
- **Never name a partner resort.** It is the one thing that would cost Irshad money.
- **Never put `aria-label` on a plain `<div>` or `<span>`.** A roleless generic
  takes no ARIA label — the browser DISCARDS it. A review's star rating shipped
  this way: the stars were `aria-hidden` and the label was dropped, so the rating
  was announced as nothing to screen readers and AI agents, and Lighthouse's
  "accessibility tree is not well-formed" audit failed. Use real text in a
  `.sr-only` span. `pnpm verify:aria` now fails the build on it.
- **Every light↔dark edge is a `RiverDivider`, never a straight cut.** It takes
  semantic band names (`from="bg" to="deep"`), plus `size` and `flip`, so no page
  repeats a hex. The colours live once in `src/styles/bands.ts`, which mirrors
  `@theme`; they are hex rather than `var()` because an SVG `fill` cannot read a
  CSS custom property. `verify:content` fails on BAND/`@theme` drift and on a dark
  band with no bend. Full pattern in `docs/style-guide.md`.
- **`Contact.astro` is rendered on every page, not just the homepage.** It carries
  the crawlable NAP, the CTAs and the footer, so one block serves all pages rather
  than a full copy and a reduced one that drift apart. Its heading level is a prop
  (`as`), defaulting to `h2` — which is correct on both page types, because the
  homepage runs h1(hero)→h2(sections) and a legal page runs h1(title)→h2(clauses).
  Do not demote it to a `<p>` on legal pages: the "Where he is based" `h3` nests
  under it, and an `h3` whose parent is a paragraph is an orphan.
- **The footer sets its own dark band.** Every colour inside it is an opacity of
  `primary-foreground` (white), inherited from Contact's section when it lived
  there. Rendered without `bg-primary-deep` it is white-on-paper at ~1.1:1 —
  present in the DOM, invisible on screen, and passing every gate. `verify-content`
  now asserts each `<footer>` names its own background.
- **An editor's Heading 1 renders as `<h2>` on a legal page.** The Sanity `title`
  field is the page's only `<h1>`; `LegalBody.astro` shifts every body heading one
  level down (h1→h2, h2→h3, h3→h4). Rendering the editor's h1 literally would ship
  two h1s and flatten the outline for screen readers and for the AI agents that now
  read this site — silently, because it looks identical. `verify-content` asserts
  exactly one `<h1>` per legal page.
- **A legal page with an empty body does not exist.** This is the one content gate
  that is NOT `Confirmed<T>` — a privacy policy is not a fact awaiting Irshad's
  confirmation, it is a document that either exists or does not. So the gate is
  publish state: `isPublished()` (`src/content/legal.ts`) filters them at the
  adapter, `getStaticPaths` never builds them, and the footer link is absent.
  `verify-content` fails if the footer link set and the built page set disagree,
  because a footer link to an unbuilt page is a link to a 404 — the exact defect
  this site exists to fix.
- **A Portable Text link's href lives on `node.markDef`, not `node`.** Reading
  `node.href` yields `undefined` and every link renders `href="#"` — no error, no
  warning, just a dead link. This shipped once; `verify-content` now fails on any
  `<a href="#">` in a legal page.
- **The OG card regenerates on every build.** `pnpm build` runs `pnpm og`, which
  serves `dist/` on an ephemeral port and screenshots `/og` with a browser it
  launches itself — `@sparticuz/chromium` on Linux, local Chrome on macOS. It
  writes **both** `public/og.jpg` and `dist/og.jpg`: Astro copies `public/` into
  `dist/` _during_ the build, so a post-build render that wrote only to `public/`
  would leave the deployed image stale.
- **A failed render must never fail the deploy.** On Vercel (`VERCEL`/`CI` set)
  the script logs and exits 0, so the committed `og.jpg` ships unchanged — a
  stale card beats an outage. Locally it exits 1, because `pnpm og` silently
  "succeeding" after a failure is a lie.
- **The raster can still drift, so it is gated.** `pnpm og` stamps
  `scripts/og.meta.json` with the text it baked in, and `verify-content` fails
  when that no longer matches the live content.
- **Keep the page at zero separate `.js` files.** Check with `pnpm verify:content`.
- Do not reorganise `src/` or rename components unprompted.
- Do not add dependencies without approval.

## Images

All images are served from **Sanity's CDN** (`cdn.sanity.io`). The Wikimedia Commons
originals were re-hosted there: same files, same CC BY-SA obligations, which travel
with the asset as a `credit` field and still render in the footer.

**Attribution never goes in alt text.** Alt describes the image to screen-reader users;
putting a credit there degrades that _and_ fails the licence, since sighted users never
see it. `imageWithMeta` keeps them separate and the Studio blocks a CC BY-SA image
saved without a credit.

Why the move: Commons 302s from `commons.` to `thumb.wikimedia.org` and snaps
thumbnails to its own buckets, always rounding **up** — a request for 1600w returned
1920px/897KB. Sanity is one host, no redirect, exact widths, WebP via `auto=format`.
The hero went 897KB → 302KB.

The fleet cards show **commissioned illustrations of Irshad with each vehicle**, not
photographs, and the page says so. 13 of the 58 photographs Irshad sent are
deliberately excluded — see `scripts/asset-manifest.json` for each reason, and
`verify-content` fails if one ever renders.

## Documentation

| Doc                      | Covers                                                        |
| ------------------------ | ------------------------------------------------------------- |
| `docs/content-rules.md`  | The honesty rules, and the bug each one was written after     |
| `docs/dandeli-facts.md`  | Verified facts **and the do-not-publish list**                |
| `docs/style-guide.md`    | Tokens, type scale, motion curves, component rules            |
| `docs/seo.md`            | Schema decisions, including why there is no `aggregateRating` |
| `docs/launch-runbook.md` | What remains before go-live, and the off-site actions         |

## Reference

- [AGENTS.md](AGENTS.md) — the gates, Definition of Done, operational scope
- Highest-value action is **off-site**: replace the 404 website URL on his Google
  Business Profile, and add secondary categories. Both free, both worth more than
  anything in this repo.
