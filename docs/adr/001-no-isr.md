# ADR 001 — Rebuild on publish, not ISR

**Status:** accepted · **Date:** 2026-11-06

## Context

Content is moving to Sanity. Publishing must update the live site.

The site is Astro 7, `output: 'static'`, zero client JavaScript, on Vercel.
Content changes a handful of times a month.

## Decision

A Sanity webhook calls a Vercel Deploy Hook, triggering a full static
rebuild. The site stays `output: 'static'`. Setup is in
`docs/deploy-on-publish.md`.

## Alternatives rejected

**Vercel ISR.** Astro's Vercel adapter documents ISR as "Available for:
Serverless" — verified against the docs, not assumed. ISR is a serverless
function; a prerendered site has none. Adopting it requires
`output: 'server'` and the adapter, which puts a function in front of a
one-page brochure site and converts a build-time content error into a
runtime 500. The site's purpose is to replace a three-year-old 404; it must
not acquire a new way to fail in front of a customer.

**Per-document cache tags**, as used on v2.kunalkeshan.dev. That is
Next.js `revalidateTag`. Astro has no tag-based cache, and Vercel requires
a function response to attach `Vercel-Cache-Tag`, so a static page cannot
carry one. Structurally unavailable.

## Consequences

- A publish takes ~60s to appear. Acceptable at this cadence.
- Invalidation is whole-site. There is nothing to get subtly wrong.
- No serverless functions, no tokens, no runtime failure mode.
- The webhook must filter drafts off, or autosave triggers a build per
  keystroke. This is the one real footgun.
