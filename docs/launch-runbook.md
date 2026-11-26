# Launch runbook

## Status: live

The site is at [https://namastedandeli.com](https://namastedandeli.com), on Vercel
production, with `namastedandeli.com` as the custom domain and no `SITE_URL` override.

## Legal pages

Both are live at `/legal/privacy-policy` and `/legal/terms-and-conditions`, from Sanity
and linked in the footer.

- **Irshad has read both** and agreed with them.
- **Privacy policy, 26 November 2026:** removed _"The site runs without any JavaScript of
  its own."_ The Google Analytics paragraph is unchanged.
- **DPDP:** the live policy cites India's Digital Personal Data Protection Act 2023 as a
  future duty (remaining provisions commence **May 2027**) and says the policy is written
  to meet it early. It does **not** say "under the DPDP Act you have the right to…". See
  `docs/content-rules.md` rule 7.

## Facts confirmed at launch (26 November 2026)

| Topic    | What publishes                                                                          |
| -------- | --------------------------------------------------------------------------------------- |
| Hours    | Call to check availability. He answers early and late. Not 24/7.                        |
| WhatsApp | Same as phone: +91 94490 06326                                                          |
| Solo     | Vehicle and driver numbers before pickup; plus the two public-listing evidence bullets  |
| Routes   | Eight transfer distances (OSRM, Dandeli bus stand), measured 26 Nov 2026                |
| Pricing  | Sedan ₹2,500 / Ertiga ₹3,200 local slabs confirmed; cruiser, airport, outstation = call |
| Fleet    | Sedan, Ertiga, Cruiser ("toofan"); no Innova on the page                                |
| Humsafar | Customer alias only — not the business name                                             |
| Photos   | Commissioned fleet illustrations; resort photos unnamed                                 |

**Deliberately not published**

- "Irshad always drives" — other trusted drivers take some trips.
- "One number answered at all hours."

Run **`pnpm blockers`** after a build; two assurances still list **DECIDED** blockers so
the decision stays on record.

## Measure routes again

If a route changes: measure twice (`node scripts/measure-routes.mjs`), then patch Sanity
or update `scripts/.route-measurements.json` and `node scripts/patch-post-launch.mjs`
(route section only), or edit in Studio. Mirror in [`src/content/routes.ts`](src/content/routes.ts).

## Deploy

```bash
pnpm verify
# Vercel production deploys from main; Sanity webhook may trigger rebuild — see docs/deploy-on-publish.md
# Bulk seeds/migrations: withSingleProductionRebuild in scripts/sanity-bulk-write.mjs (one build, not N)
```

## Analytics

Container **`GTM-5Q5VJ89S`** loads on production.

| Step                                                           | Status    |
| -------------------------------------------------------------- | --------- |
| Container ID in `src/content/analytics.ts`                     | Done      |
| GTM GA4 event tag for `contact_click` / `section_view`         | Done      |
| GA4 custom dimensions `method`, `placement`                    | **To do** |
| Register new `placement` values: `sticky`, `inline`, `enquiry` | **To do** |
| DebugView check (one call + one WhatsApp CTA)                  | **To do** |
| `contact_click` as key event                                   | **To do** |

See §4 steps in the historical notes below for GTM/GA4 UI wiring.

### What gets tracked

One event, `contact_click`, with `method` (`call` / `whatsapp` / `maps`) and `placement`.
Plus `section_view` per section. `routes_fare` still appears only on unconfirmed routes (none
today).

## Off-site — still to do

These are not website changes:

1. **Google Business Profile:** set the website URL to `https://namastedandeli.com/`
   (previously 404).
2. **Secondary categories** (`docs/seo.md`): Car rental agency, Tour operator, Airport
   shuttle service, Travel agency, Chauffeur service.
3. **Search Console:** submit `https://namastedandeli.com/sitemap-index.xml`.

**Done:** OG card checked in WhatsApp.

## Ongoing

| When                            | Do                                                                     |
| ------------------------------- | ---------------------------------------------------------------------- |
| Review count moves meaningfully | `pnpm og` — the card is a static image (still 160+)                    |
| Before any content refresh      | Re-pull reviews; authors can edit or delete                            |
| A fact gets confirmed           | Studio or patch scripts; mirror `src/content/`; re-run `pnpm blockers` |
| Monthly                         | Verify Sanity CDN images still resolve (`pnpm verify:content`)         |

## Accepted trade-offs

- **Content images** are on the Sanity CDN (not Commons hotlinks).
- **Fleet cards** are commissioned illustrations of Irshad with each vehicle; disclosed on the page.
- **The logo** is Airsaat's artwork — `scripts/trace-logo.mjs`, not hand-edited paths.
- **Transfer distances** render only as confirmed measurements (date + source on each route).

## GTM / GA4 setup (reference)

1. Container ID in `src/content/analytics.ts` (production only).
2. In Tag Manager: GA4 Event tag (`{{Event}}`) on Custom Event `contact_click|section_view`,
   Data Layer Variables `method` and `placement`.
3. GA4 Admin → Custom definitions → event-scoped `method` and `placement` (not retroactive).
4. Realtime + DebugView on the live domain.
5. Optionally mark `contact_click` as a key event.
