# Redeploying when Irshad publishes

When content lives in Sanity, publishing a change has to rebuild the site.
This is the whole mechanism, start to finish, and why it is built this way.

---

## The model, in one line

**Sanity webhook → Vercel Deploy Hook → full static rebuild.**

A rebuild _is_ the cache invalidation. Vercel's cache key includes the
deployment URL, so a new deployment serves new URLs and there is nothing
left to purge. No cache API call, no revalidation endpoint, no tokens.

---

## Why not ISR

ISR is the obvious-looking answer and it does not work here.

Astro's Vercel adapter documents ISR as **"Available for: Serverless"**.
ISR _is_ a serverless function: a request arrives, a function renders or
serves a cached render. A fully prerendered site has no function to hit —
its pages are files on a CDN.

Adopting it would mean `output: 'server'`, the `@astrojs/vercel` adapter,
and a serverless function in front of a one-page brochure site. That buys
finer-grained invalidation we do not need (content changes a few times a
month) and costs the thing the site exists for: it introduces a runtime
failure mode. A build-time content error becomes a **500 for a customer**
instead of a red build we see first.

For three years Irshad's Google listing pointed at a 404. The site's first
job is to exist and keep existing. Static files do that.

Astro also has no `revalidateTag`/`revalidatePath`, and static pages cannot
carry `Vercel-Cache-Tag` (Vercel requires a _function response_ to attach
one). So the per-document invalidation used on v2.kunalkeshan.dev — a
Next.js app — has no Astro equivalent. Do not try to port it.

---

## Setup

### 1. Create the Vercel Deploy Hook

Vercel → the project → **Settings → Git → Deploy Hooks**

- **Name:** `sanity-publish`
- **Branch:** `main`
- **Create Hook**, then copy the URL. It looks like:
  `https://api.vercel.com/v1/integrations/deploy/prj_XXXX/YYYY`

> **Treat this URL as a secret.** Anyone holding it can trigger unlimited
> production builds. It is not in this repo on purpose. If it leaks,
> delete the hook and make a new one — there is no way to rotate it.

### 2. Point a Sanity webhook at it

[sanity.io/manage](https://sanity.io/manage) → project `krbamcti` →
**API → Webhooks → Create webhook**

| Field       | Value                           |
| ----------- | ------------------------------- |
| Name        | `Rebuild site on publish`       |
| URL         | the Deploy Hook URL from step 1 |
| Dataset     | `production`                    |
| Trigger on  | ✅ Create ✅ Update ✅ Delete   |
| **Drafts**  | ❌ **OFF** — see below          |
| Filter      | the GROQ below                  |
| HTTP method | `POST`                          |
| HTTP body   | leave empty (Vercel ignores it) |
| Secret      | leave empty (nothing reads it)  |

**Filter** — only rebuild for types the site actually renders, so editing
an unrelated document does not burn a build:

```groq
_type in [
  "siteSettings", "vehicle", "activity",
  "stay", "route", "review", "assurance"
]
```

### 3. Why drafts must be OFF

Sanity autosaves a draft on **every keystroke**. With drafts enabled, this
webhook fires on each one — Irshad typing a sentence would queue dozens of
production builds and exhaust the Vercel build quota in a single editing
session.

With drafts off it fires only on **Publish**, which is the intent.

The site reads with `perspective: 'published'`, so unpublished drafts could
not reach the live page even if a build did run.

---

## Verifying it works

1. In the Studio, change one word and **Publish**.
2. Vercel → Deployments: a build should appear within ~10 seconds.
3. The change is live in ~60 seconds (this site builds in well under a minute).
4. Now type in a field and **do not** publish — **no** deployment should start.
   If one does, the Drafts toggle is still on.

---

## Costs and limits

- One rebuild per publish. Batch edits, then publish once.
- Vercel's free tier allows 100 deployments/day — far beyond a few content
  edits a month, but a misconfigured drafts toggle will hit it.
- The build fetches content once (`getContent()` is memoized), so a rebuild
  is one GROQ query, not one per component.

---

## When this needs revisiting

If content ever changes many times a day, or if per-document invalidation
becomes genuinely necessary, the move is `output: 'server'` + the Vercel
adapter + ISR — accepting the runtime failure mode that comes with it.
That is a deliberate trade, not an upgrade. See `docs/adr/001-no-isr.md`.
