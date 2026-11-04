# AGENTS.md — AI Agent Operational Policies (namaste-dandeli)

## Purpose and Precedence

- Use this file for execution behaviour: what to run, what to check, when to stop and ask.
- Use [CLAUDE.md](CLAUDE.md) for project architecture, the content contract, and domain facts.
- **If guidance overlaps, follow the stricter workflow requirement.**

## What this site is, in one line

A single static page for a real one-man cab business in Dandeli, Karnataka. Every
claim on it is about a real person's livelihood, so **the honesty rules below are
not style preferences — they are the point of the project.**

## Trigger-Based Command Policy

- Run `pnpm build`, `pnpm check`, `pnpm verify` freely — they are read-only w.r.t. source.
- `pnpm format` rewrites files: run it, but say so.
- **Do not install or upgrade packages without explicit approval.**
- **Do not push, tag, or open PRs unless asked.**
- `pnpm og` regenerates the social card and overwrites `public/og.jpg` — ask first.

## Definition of Done

Before any task is complete:

- [ ] `pnpm verify` passes (format, types, build, content, accessibility)
- [ ] `pnpm blockers` reviewed — no new unconfirmed fact is rendering
- [ ] Every gate below that fired has been actioned **and** its follow-up delivered
- [ ] Docs updated in the same change set if architecture, rules or tokens changed
- [ ] No fact about Irshad's business added without a confirmed source

---

## Gates

Each gate **self-fires only when its trigger matches your change** — most are `N/A`
for a given task. For every gate that fires you must do its action **and** its
follow-up: **(Q)** ask the user a decision question, **(C)** report the outcome.

**Close-out (not optional):** end the task with one consolidated message marking each
gate `done` / `N/A` / `deferred — reason`, bundling all **Q**s into a single
`AskUserQuestion`. Do not call the task complete until the user responds.

- [ ] **Unconfirmed fact (Q)** — added or changed a claim about the business (hours,
      rates, vehicles, service promises, availability) → typed as `Confirmed<T>` in
      `src/content`, so an unconfirmed value renders a fallback and never the claim.
      Ask whether Irshad has actually confirmed it.
      _An unconfirmed "24 hours, every day" rendered on the live page for days behind a
      `hoursConfirmed: false` flag that no component read. A flag nobody reads is not a
      guard — the type must make the claim unprintable._ → `docs/content-rules.md`

- [ ] **Verbatim quote (C)** — added or edited a customer review or pull-quote → the
      text is a contiguous verbatim span of the source review, typos intact and
      `pnpm verify:content` passing. Report which review and that the guard held.
      _`Routes.astro` hardcoded a review as a string literal while importing the review
      object, so the build guard covered everything except the one quote on screen._
      → `docs/content-rules.md`

- [ ] **Published number (Q)** — a distance, drive time, price or statistic appears on
      the page → it renders only via a confirmed value carrying its measurement date.
      Ask the user for the source.
      _A research agent fabricated drive times while labelling them "[VERIFIED-MAPS]";
      the Goa figure was wrong by 80+ minutes. A wrong drive time means a customer
      misses a flight._ → `docs/dandeli-facts.md`

- [ ] **Accessibility (C)** — changed a colour, hover state, font size, or interactive
      element → run `pnpm verify:a11y`; report the ratios.
      _The accent hover shipped at 3.61:1 because it lightened the button. Hover states
      need contrast too._ → `docs/style-guide.md`

- [ ] **Brand red (C)** — used the `brand` token → assert it appears only inside the
      logo SVG and never as a UI colour; `pnpm verify:content` reports the count.
      _Brand red and primary green converge to 1.25:1 under protanopia. Red is safe here
      only because it never carries meaning._ → `docs/style-guide.md`

- [ ] **Zero JS (C)** — added a script, integration, or client directive → confirm
      `dist/` still has no separate `.js` files and the page renders with JS disabled.
      Report both.
      _The performance argument for this audience — tourists on Indian mobile data —
      rests entirely on this._ → `CLAUDE.md`

- [ ] **Image provenance (Q)** — added an image → record its licence and whether it
      depicts the real subject or is representative. Ask whether an on-page disclosure
      is needed.
      _The only "Dandeli resort" photos on Commons are a named competitor's marketing
      shots with signage visible. The vehicle cutouts are model photos, not his cars —
      which is why the page says so._ → `docs/content-rules.md`

- [ ] **Docs sync (C)** — changed architecture, content rules, design tokens or
      guardrails → update `CLAUDE.md` / `AGENTS.md` / `docs/` in the same change set.
      Report what you updated.
      _Adjacency is the whole anti-drift mechanism: it is the only moment the author
      knows whether the doc is still true._

---

## Agent Operational Scope

### Freely editable

- `src/components/` — presentation
- `src/styles/global.css` — tokens (then run the accessibility gate)
- `docs/` — documentation

### Requires care

- `src/content/*.ts` — **facts about a real business.** Changing a value here changes
  what the site claims about someone's livelihood. Read `docs/content-rules.md` first.
- `src/content/confirmed.ts` — the guard itself. Weakening it silently re-opens every
  bug it was built to prevent.
- `scripts/verify-*.mjs` — the gates. Loosening a threshold needs an explicit reason.
- `src/components/Motion.astro` — the only JavaScript on the site.

### Never without explicit instruction

- **Never add `aggregateRating` to the structured data.** Google ignores self-reported
  ratings; it renders nothing and risks a policy problem. See `docs/seo.md`.
- **Never edit a customer review's text.** The typos are theirs. An edited testimonial
  is a fabricated one.
- **Never publish a distance or price that has not been measured or quoted.**
- **Never use brand red as a UI colour.**

## Conflict Resolution

Where rules conflict, the stricter wins:

- The unconfirmed-fact guard beats any request to "just put the hours back"
- The verbatim rule beats any copy-editing improvement to a review
- The zero-JS rule beats a convenience library

If a user asks for something these rules forbid, say so once, explain the specific
harm, and do it if they confirm — it is their business and their call.
