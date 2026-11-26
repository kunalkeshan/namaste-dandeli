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

## How it works (read this before any seed or migration)

```text
Irshad publishes in Studio          You run a seed script (CLI import)
           │                                    │
           └──────────────┬─────────────────────┘
                          ▼
              Sanity commits change(s)
                          ▼
         Webhook "Rebuild Site on Publish"
         (production dataset, drafts OFF)
                          ▼
              POST → Vercel Deploy Hook
              (rebuilds Git branch: main)
                          ▼
              Vercel runs pnpm build → static dist/
                          ▼
              Production URL serves new HTML
```

**Git is not involved in step 2–4.** A deploy hook does not push code. It
tells Vercel to rebuild **whatever commit is already on `main`**. That is
why a deployment storm shows the **same commit message dozens of times** —
only the Sanity content changed, not the repo.

### What triggers one rebuild vs many

| Trigger                              | Webhook type      | Typical result                                                                      |
| ------------------------------------ | ----------------- | ----------------------------------------------------------------------------------- |
| Irshad **Publish** one doc in Studio | Transaction       | **1** Vercel build                                                                  |
| `sanity dataset import` with 27 docs | Document (legacy) | **27** builds — one per document                                                    |
| `sanity dataset import` with 27 docs | Transaction       | **1–N** builds — one per Sanity _transaction_ (imports often use many transactions) |
| Import **without** pausing the hook  | Either            | **N** builds queued on Vercel                                                       |

The safe rule for **scripts**: assume **N builds** unless you explicitly
coalesce to **1**.

### The rule for agents and maintainers

Any script that **writes the production dataset** in bulk must use
**one** production rebuild afterward:

1. `node scripts/rebuild-webhook.mjs pause` — stop Sanity calling Vercel
2. Run all imports / patches (single batch of work)
3. `node scripts/rebuild-webhook.mjs trigger` — **one** deploy hook call
4. `node scripts/rebuild-webhook.mjs resume` — normal Studio publishes work again

Repo helper (used by all seed scripts):

```js
import { withSingleProductionRebuild, skipRebuildPause } from './sanity-bulk-write.mjs';

withSingleProductionRebuild(
  () => {
    /* dataset import, client.mutate, etc. */
  },
  { skip: skipRebuildPause() },
);
```

Opt out only when targeting a non-production dataset or you will rebuild
manually later: `--no-rebuild-pause` or `SANITY_NO_REBUILD_PAUSE=1`.

**Scripts that already wrap imports:** `seed-sanity.mjs`,
`seed-marketing-pages.mjs`, `seed-legal.mjs`, `patch-post-launch.mjs`.
New bulk-write scripts must do the same.

### Studio editing (Irshad)

- **Publish** → one transaction → one rebuild (with the transaction webhook).
- **Type without publishing** → no rebuild (drafts must stay **off** on the
  webhook).
- Batch edits in Studio, then **publish once** when possible.

### What “deployment loop” looked like (Nov 2026)

`seed-marketing-pages.mjs` ran `dataset import --replace` on 27
`marketingPage` documents while a **document** webhook with **no GROQ
filter** was active. Sanity fired 27 POSTs to the deploy hook in one second;
Vercel queued 27 production builds of the same `main` commit. Not an
infinite Git loop — a **backlog**.

**Project state now:** webhook is **transaction** type; seeds use
`withSingleProductionRebuild`. Verify with
`node scripts/rebuild-webhook.mjs status`.

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

**Prefer type: transaction** (one call per committed transaction). Document
webhooks are one call **per document** — fine for Studio, dangerous for CLI
imports.

| Field       | Value                            |
| ----------- | -------------------------------- |
| Name        | `Rebuild Site on Publish`        |
| Type        | **Transaction**                  |
| URL         | the Deploy Hook URL from step 1  |
| Dataset     | `production`                     |
| **Drafts**  | ❌ **OFF** (document hooks only) |
| HTTP method | `POST`                           |
| HTTP body   | leave empty (Vercel ignores it)  |
| Secret      | leave empty (nothing reads it)   |

If you must use a **document** webhook, set this **filter** so unrelated
types do not trigger rebuilds:

```groq
_type in [
  "siteSettings", "vehicle", "activity",
  "stay", "route", "review", "assurance",
  "marketingPage", "legalPage"
]
```

> **Document webhooks fire once per document.** A `sanity dataset import`
> that touches 27 `marketingPage` docs queues **27 production builds** on
> Vercel (same `main` commit, different deployment rows). That looks like a
> loop; it is a backlog. Prefer a **transaction** webhook (one rebuild per
> committed transaction) or pause the hook during bulk seeds — see below.

### 3. Why drafts must be OFF

Sanity autosaves a draft on **every keystroke**. With drafts enabled, this
webhook fires on each one — Irshad typing a sentence would queue dozens of
production builds and exhaust the Vercel build quota in a single editing
session.

With drafts off it fires only on **Publish**, which is the intent.

The site reads with `perspective: 'published'`, so unpublished drafts could
not reach the live page even if a build did run.

---

### 4. Bulk imports (seeds and migrations)

Do **not** call `sanity dataset import` or bulk `client.mutate` against
`production` without `withSingleProductionRebuild` — see **How it works**
above.

Manual equivalent:

```bash
node scripts/rebuild-webhook.mjs pause
node scripts/seed-marketing-pages.mjs    # or any bulk writer
node scripts/rebuild-webhook.mjs trigger
node scripts/rebuild-webhook.mjs resume
```

Helpers:

| Command                                                | Purpose                                     |
| ------------------------------------------------------ | ------------------------------------------- |
| `node scripts/rebuild-webhook.mjs status`              | Webhook type, disabled, filter              |
| `node scripts/rebuild-webhook.mjs pause` / `resume`    | Mute hook during bulk work                  |
| `node scripts/rebuild-webhook.mjs trigger`             | One production rebuild                      |
| `node scripts/rebuild-webhook.mjs migrate-transaction` | Replace document hook with transaction hook |

Seeds accept `--no-rebuild-pause` when you intentionally skip the coalesced
rebuild (e.g. local dataset only).

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
