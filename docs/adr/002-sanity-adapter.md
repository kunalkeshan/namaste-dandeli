# ADR 002 — The content adapter boundary

**Status:** accepted · **Date:** 2026-11-06

## Context

`src/content/index.ts` was written from the start as an adapter: components
import from it and nowhere else, and `getContent()` was `async` before
anything awaited, specifically so GROQ could replace local modules later.

## Decision

`getContent()` runs one GROQ query and returns the same shapes the local
modules returned. No component changed.

Three things make it work:

**1. One query, one round trip.** Thirteen call sites await `getContent()`
independently. The cache stores the _promise_, not the resolved value —
Astro renders concurrently, so caching after resolution would let every
caller miss and fire its own query. Measured: one fetch per build.

**2. `narrowConfirmed` rebuilds the union.** Sanity cannot express a
discriminated union; it stores one flat object with every key. The adapter
constructs a fresh object carrying only the keys the branch allows, so an
unconfirmed fact has **no `value` property** — the absence is the guarantee
that makes the claim unprintable. It fails closed: malformed data becomes
unconfirmed, never confirmed.

This matters more than it looks. Content written through the Sanity MCP
**skips Studio validation entirely**, so Studio rules are editor UX and the
adapter is the real gate.

**3. A build-emitted snapshot.** `.astro/content-snapshot.json` records what
the build actually fetched. The validators read it rather than re-reading
source files, because a source file is no longer what renders.

## What stays in code, deliberately

- `confirmed.ts` — the guard. Untouched by this change, which was the point.
- `copy.ts` — headings and WhatsApp templates. Moving it now would silently
  do nothing in three components that still hardcode the same strings
  (`Contact.astro`, `Stays.astro`, `Routes.astro`). Fix those first.
- `site.ts` link builders — they _derive_ from data rather than being data.
- Type definitions in the remaining modules.

## Consequences

- The site cannot build without Sanity reachable. Acceptable: a build
  failure is visible to us, where a runtime failure is visible to a customer.
- A missing region image throws rather than rendering a hole.
- `report-blockers` no longer needs a Vite SSR server.
