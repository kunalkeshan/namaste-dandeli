# Namaste Dandeli

Single-page site for Irshad Khan's cab and resort-booking business in Dandeli,
Karnataka.

**Astro 7 · Tailwind 4 · pnpm · zero client JavaScript · deploys to Vercel.**

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # -> dist/
pnpm verify       # format, types, build, content + accessibility gates
pnpm blockers     # every fact still waiting on Irshad
```

## Documentation

| File                                             | Covers                                                       |
| ------------------------------------------------ | ------------------------------------------------------------ |
| [CLAUDE.md](CLAUDE.md)                           | Architecture, the content contract, domain facts, guardrails |
| [AGENTS.md](AGENTS.md)                           | The eight gates, Definition of Done, operational scope       |
| [docs/content-rules.md](docs/content-rules.md)   | The honesty rules, and the bug each was written after        |
| [docs/dandeli-facts.md](docs/dandeli-facts.md)   | Verified facts **and the do-not-publish list**               |
| [docs/style-guide.md](docs/style-guide.md)       | Tokens, type, motion — live version at `/styleguide`         |
| [docs/seo.md](docs/seo.md)                       | Schema decisions, incl. why there is no `aggregateRating`    |
| [docs/launch-runbook.md](docs/launch-runbook.md) | What remains before go-live                                  |

## How it is put together

```
src/content/    all facts AND copy — the only place either lives
  index.ts      the adapter: swap this one file for Sanity later
  confirmed.ts  the Confirmed<T> guard — read this first
src/components/ one .astro file per section
scripts/        the gates: verify-content, verify-a11y, report-blockers, render-og
```

## The rules the build enforces

**No unconfirmed claim can render.** Facts about the business are typed
`Confirmed<T>`; an unconfirmed value has no `value` property, so a component
physically cannot print it. This replaced three flags that had drifted — one worked,
two were dead, and an unconfirmed "24 hours, every day" was rendering on the live page
behind one of them.

**No edited testimonials.** Pull-quotes are asserted at build time to be contiguous
verbatim spans of their source review. Reword one and the build fails. Review typos
are intentional — an edited testimonial is a fabricated one.

**No unmeasured numbers.** Distances render only through the guard. A research agent
once fabricated a drive time that was wrong by 80+ minutes; a wrong drive time means a
customer misses a flight.

Plus: brand red only inside the logo, no `aggregateRating`, zero `.js` files, every
text pair ≥ AA including hover states. All checked by `pnpm verify`.

## Gates

`pre-commit` (~2s) runs format, types and the content validators. `pre-push` (~60s)
runs the full build plus the content and accessibility gates. The split exists because
a slow pre-commit hook gets bypassed, and a bypassed gate is no gate.

The eight self-firing gates for AI agents and contributors are in [AGENTS.md](AGENTS.md).

## Before launch

Run `pnpm blockers` — the list is generated from the code, so it cannot go stale.
Currently 14 facts await Irshad's confirmation. See
[docs/launch-runbook.md](docs/launch-runbook.md).

**The highest-value action is not in this repo:** the website link on his Google
Business Profile returns 404, and he has only one Google category. Both are free fixes
worth more than anything here.
