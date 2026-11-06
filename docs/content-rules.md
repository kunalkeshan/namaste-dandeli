# Content rules

Every rule here was written after shipping the bug it prevents. They are enforced by
types and validators rather than by memory, because memory already failed.

---

## 1. An unconfirmed fact must be unrenderable

**The bug.** `site.hoursConfirmed: false` existed, and **no component read it**. An
unconfirmed "24 hours, every day" rendered on the live page. `ownPhotos.ready` was dead
the same way. Only `routes.verified` actually gated anything — one field out of several.

**The rule.** Facts about Irshad's business are typed `Confirmed<T>`:

```ts
type Confirmed<T> =
  | { confirmed: true; value: T; confirmedOn: string }
  | { confirmed: false; fallback: string; blocker: string };
```

An unconfirmed value **has no `value` property**, so a component cannot print the claim
even by accident. The fallback must be honest on its own — never a softened version of
the unconfirmed claim:

| Unconfirmed           | Fallback                     | ✗ Wrong fallback         |
| --------------------- | ---------------------------- | ------------------------ |
| "24 hours, every day" | "Call to check availability" | "Usually available 24/7" |
| A measured distance   | "Ask the fare"               | "About 70 km"            |

**Safety promises are omitted, not hedged.** The solo-travel assurances disappear
entirely while unconfirmed, because a hedged safety promise is worse than none.

`pnpm blockers` lists every outstanding one as the question to ask Irshad.

---

## 2. A quote is verbatim or it is fabricated

**The bug.** `Routes.astro` hardcoded a review as a string literal while _also_
importing the review object for attribution. The build guard covered `reviews.ts` and
missed the one quote actually on screen.

**The rule.** Pull-quotes are a `pull` field on the review, asserted at build time to be
a contiguous verbatim span of `text`. Reword one and the build fails.

**Typos stay.** "confortable", "Susuki", "bcos", "does'nt" are how those customers
wrote. Correcting them is embellishment, and an embellished testimonial is a fabricated
one about a real named person.

**One customer, one appearance.** Seven reviews are stored; each appears exactly once —
hero, solo section, routes proof, and four in the grid. `Reviews.astro` filters by
`role` to enforce it.

**Re-pull before each refresh.** Authors can edit or delete their reviews.

---

## 3. No number without a measurement

**The bug.** A research agent fabricated drive times while labelling them
"[VERIFIED-MAPS]". The Goa figure was wrong by **80+ minutes**. A wrong drive time on a
cab site means a customer misses a flight.

**The rule.** Distances, drive times, prices and statistics render only through
`Confirmed<T>` with a `confirmedOn` date. Unmeasured routes show "Ask the fare", which
is honest and still converts — it starts a phone call.

Prices: we have **one** real package (Sedan ₹2500, Ertiga ₹3200 / 8h / 80km, +₹15/km,
+₹100/hr). The page explains _how his pricing works_ rather than inventing a tariff table.

---

## 4. Say whose photo it is

**The finding.** The only "Dandeli resort" images on Wikimedia Commons are one named
competitor's own marketing photos, with its signage visible — both a trademark problem
and the exact opposite of Irshad's no-names requirement.

**The rules.**

- Partner resorts are **never named** — a named resort gets booked direct and he loses
  the introduction. Stays are grouped by what they are _like_. **This holds on the
  legal pages too**, where a drafter is most tempted to write a real name into a
  clause: the terms say "the property you are booked into". `pnpm verify:content`
  scans every built legal page for the known partner name.
- Photographs showing the region, not a property, say so in body text — not small print.
- The vehicle cutouts are **model photographs, not his cars**, disclosed under the grid.
- Every image records its licence in `content/images.ts`; CC BY-SA credits render in the
  footer automatically.

---

## 5. Colour never carries meaning alone

Brand red and the primary green converge to **1.25:1 under protanopia** — effectively
identical. Red is safe on this page only because it appears exactly twice, both inside
the logo SVG, and never encodes state.

`pnpm verify:content` fails if brand red appears as a UI colour.

---

## 6. Google's rating is shown, not marked up

Google ignores self-reported `aggregateRating` for star snippets and explicitly bars
aggregating ratings from other sites. Including it renders nothing. The 4.9 is **visible
HTML** linked to the live listing — allowed, and what actually converts. See `docs/seo.md`.

---

## 7. A legal page is published or it does not exist

**The shape.** The privacy policy and terms are `legalPage` documents in Sanity,
ordered by the `siteSettings.legalPages` reference array — the array order _is_ the
footer order. They are deliberately **not** behind `Confirmed<T>`: that guard exists
for measured claims about Irshad's business, and its payload is a `blocker`, the
question to put to him. A privacy policy is not a fact awaiting his confirmation.

**The rule.** A legal page renders only if it **has a body**. An empty body means the
page does not exist — it is not built, and the footer link is absent. One function,
`isPublished()` in `src/content/legal.ts`, is the only definition of that, because
three call sites need the answer (build the page? render the link? did those two
agree?) and three hand-written `body?.length` checks would be three chances to drift.
`site.hoursConfirmed` drifted exactly that way.

**Why not a 404 page.** Building an empty page that soft-404s would be strictly worse:
the footer would advertise a link to nothing. That is the precise defect this entire
site exists to fix — his Google Business Profile's website URL returns HTTP 404.

**Contact details are read, never retyped.** The phone, WhatsApp and email on the
legal pages come from the content adapter. A terms document with a hardcoded number is
the one place on the site that would still claim an old number after he changed it in
the Studio. `verify-content` fails on any `+91…` in a legal page that does not match
`siteSettings.phone`.

**Headings shift one level.** The page title is the only `<h1>`; an editor's Heading 1
renders as `<h2>`. See the guardrail in `CLAUDE.md`.

**The bug this was written after.** The first render read `node.href` for a link
annotation. Portable Text stores it on `node.markDef`, so every link in the policy
rendered `href="#"` — no error, no warning, a dead link in a legal document. The
validator now fails on any `<a href="#">` in a legal page.

### On citing law

The privacy policy does **not** say "under the DPDP Act you have the right to…". The
Digital Personal Data Protection Act 2023 was enacted on 11 August 2023 and its Rules
were notified on 13 November 2025, but the substantive obligations — notice, consent
and data-principal rights — **commence 13 May 2027**. Until then the IT Act 2000 and
the 2011 Privacy Rules govern.

So the rights are stated as **what Irshad will do if you ask**: true today, and still
true after May 2027. Citing a duty that does not yet bind is the same class of error as
publishing an unmeasured number — a claim that sounds authoritative and is wrong.

---

## Enforcement

| Rule                  | Enforced by                                      |
| --------------------- | ------------------------------------------------ |
| Unconfirmed facts     | `Confirmed<T>` type + `pnpm verify:content`      |
| Verbatim quotes       | build-time assertion in `reviews.ts` + validator |
| No unmeasured numbers | `Confirmed<Distance>`                            |
| Brand red             | `pnpm verify:content`                            |
| No aggregateRating    | `pnpm verify:content`                            |
| Contrast incl. hover  | `pnpm verify:a11y`                               |
| Zero JS               | `pnpm verify:content`                            |
| Legal publish state   | `isPublished()` + `pnpm verify:content`          |
| One h1 per legal page | `pnpm verify:content`                            |
| No dead legal link    | `pnpm verify:content`                            |
| No resort named       | `pnpm verify:content`                            |

All of it runs on `pre-push`. The fast checks run on `pre-commit`.
