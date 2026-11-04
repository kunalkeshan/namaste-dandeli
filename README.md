# Namaste Dandeli

Single-page site for Irshad's cab and resort-booking business in Dandeli, Karnataka.

**Stack:** Astro 7 (static) · Tailwind 4 · pnpm · zero client JavaScript.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # -> dist/
pnpm preview
```

## How it is put together

```
src/
  content/      all copy and data — the ONLY place facts live
    index.ts    the adapter: swap this one file for Sanity later
  components/   one .astro file per section
  layouts/      the page shell: <head>, fonts, JSON-LD
  styles/       design tokens (@theme) and base styles
```

Components import from `src/content` and nowhere else. When Sanity is
added, `content/index.ts` becomes GROQ queries returning the same
shapes and no component changes.

## Two rules enforced by the build

**1. No invented numbers.** `content/routes.ts` has `verified: boolean`
on every route. The UI renders a distance *only* when it is true;
otherwise it shows "Ask the fare". A wrong drive time means a customer
misses a flight, so the honest path is the only one reachable.

**2. No edited testimonials.** `content/reviews.ts` ends with a guard
asserting that every short pull-quote is a contiguous verbatim span of
its full review. Reword one and the build fails. Review typos
("confortable", "Susuki", "bcos") are intentional — editing a
testimonial is fabricating one.

## Accessibility

Verified, not assumed:

- every text pair ≥ AA, most AAA; borders ≥ 3:1
- all pairs survive protanopia and deuteranopia simulation
- brand red appears **twice**, both inside the logo SVG — never as a
  UI colour, because red/green converge to ~1.25:1 under protanopia
- one `<h1>`, no heading skips, alt text on every image
- 3px focus ring on all 22 controls; no tap target under 44px
- `prefers-reduced-motion` respected

## Images

Hotlinked from Wikimedia Commons — real, licence-cleared photographs
of Dandeli, not generic stock. All URLs live in `content/images.ts`;
when Irshad sends his own photos, that one file changes. CC BY-SA
credits render in the footer automatically.

## Before launch — needs Irshad

- [ ] Real rates (only one package is known)
- [ ] Confirm hours (reviews suggest 24/7)
- [ ] Confirm WhatsApp number matches +91 94490 06326
- [ ] Confirm the claims in the "Travelling alone" section
- [ ] His own photos: himself with the car, and partner resorts with
      signage cropped out
- [ ] Logo as vector from the original designer (ours is rebuilt from
      a photograph of the car)

**Highest-value action, and it is not on this site:** the website link
on his Google Business Profile returns 404. Replacing it with this
site's URL is free and immediate. Second: he has only one Google
category — adding Car rental agency, Tour operator, Airport shuttle
service, Travel agency and Chauffeur service is his biggest ranking
lever.
