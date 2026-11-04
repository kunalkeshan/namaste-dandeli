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

## Motion

All CSS transitions on GPU-only properties, plus one 2.5KB inline
script. The page still ships **zero separate .js files**.

- **Scroll reveals** — sections fade and rise 8px once, via
  IntersectionObserver. The hide-rule is gated behind
  `[data-reveal-ready]`, set by the script, so with JS blocked the
  page renders fully visible rather than blank.
- **Sticky review** — the solo-travel quote holds position on desktop
  (`position: sticky`, 1024px and up).
- **Buttons** — hover lifts 1px with a shadow and shifts colour;
  press scales to 0.97. Gated behind `(hover: hover)` so touch
  devices don't get stuck hover states.
- **Nav** — transparent over the hero, solid green with blur once
  scrolled. Uses a sentinel element rather than a scroll listener, so
  nothing runs per frame. The sentinel is the nav's own height, so
  the bar turns opaque the moment content starts passing under it;
  a taller probe left a long stretch where transparent nav text
  overlapped the hero headline. The background is a separate layer
  that cross-fades on `opacity` alone — animating `padding` and
  `backdrop-filter` forced layout on every frame and read as jank.
- **Carousels** — CSS `scroll-snap`, native momentum, zero JS. Used
  for stays so the section scrolls rather than growing very tall as
  resorts are added.
- **Marquee** — decorative place-name chips only, paused on hover.
  Never used for text people must read.

Curves are `cubic-bezier(0.23, 1, 0.32, 1)` — the built-in easings
are too weak to read as intentional. Nothing uses `ease-in`, which
delays the first frame, the exact moment the eye is watching.

`prefers-reduced-motion` stops all of it: nothing hidden, marquee
halted, transitions instant.

## Accessibility

Verified, not assumed:

- every text pair ≥ AA, most AAA; borders ≥ 3:1 — **including hover
  states** (the accent hover darkens rather than lightens; lightening
  dropped white text to 3.61:1)
- all pairs survive protanopia and deuteranopia simulation
- brand red appears **twice**, both inside the logo SVG — never as a
  UI colour, because red/green converge to ~1.25:1 under protanopia
- one `<h1>`, no heading skips, alt text on every image
- 3px focus ring on all 39 controls; no tap target under 44px at
  320px, 390px or 1440px
- no horizontal overflow at any width
- the whole page renders with JavaScript disabled
- `prefers-reduced-motion` respected

## Images

Vehicle cutouts in `/public/photos` are background-removed model
photographs (right models, not his actual cars — the page says so).
Everything else is hotlinked from Wikimedia Commons — real, licence-cleared photographs
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
