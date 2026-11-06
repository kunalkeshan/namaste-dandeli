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
pnpm verify           # check + build + content + a11y    (slow, pre-push)
pnpm verify:content   # content truth validators
pnpm verify:a11y      # contrast + colour-blindness
pnpm blockers         # every fact still waiting on Irshad
pnpm og               # regenerate public/og.jpg (needs preview + headless chrome)

pnpm dev:site         # Astro only, without the Studio
pnpm dev:studio       # Studio only (localhost:3333)
pnpm studio:deploy    # deploy the Studio to *.sanity.studio
```

## Stack

- **Astro 7**, static output, **zero client JavaScript**
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
