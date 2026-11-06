# Style guide

The living version is at **`/styleguide`** (`pnpm dev`, then
<http://localhost:4321/styleguide>). It renders from the real tokens and computes
contrast ratios rather than quoting them, so drift shows up instead of hiding. This
file carries the reasoning; the page carries the truth.

---

## Palette — "Canopy & Signal"

| Token              | Hex       | Role                                    |
| ------------------ | --------- | --------------------------------------- |
| `background`       | `#FCFBF7` | warm paper base                         |
| `foreground`       | `#122019` | body text — green-black, not pure black |
| `muted`            | `#EEF2ED` | cards, alternating bands                |
| `muted-foreground` | `#46574D` | secondary text                          |
| `primary`          | `#0F3D2E` | headings, buttons, footer               |
| `primary-deep`     | `#082219` | hero, deepest field                     |
| `accent`           | `#AE631B` | primary CTA — laterite soil             |
| `accent-ink`       | `#9A5614` | accent used as text on light            |
| `accent-bright`    | `#E08A2B` | graphics on dark only                   |
| `brand`            | `#C3160D` | **logo mark only, never UI**            |
| `border`           | `#798E79` | control edges — meets 3:1               |
| `rule`             | `#D4DCD4` | decorative hairlines only               |

### The colour-blindness rule

Brand red and primary green collapse to **1.25:1 under protanopia** — effectively
identical. Shifting the hue does not fix it; a teal/red pair reaches 1.00:1.

**The fix is not a better red. It is that hue never carries meaning alone.** Red
appears once per rendered `<Logo>` — three times on the homepage, once on the OG
card — always inside the mark, and encodes nothing.
Every accent is paired with a label, icon or underline.

`pnpm verify:content` fails if brand red appears as a UI colour.

### Hover states need contrast too

The accent hover shipped at **3.61:1** because it _lightened_ the button. Hover
colours darken: `accent` `#AE631B` → `#9C5918` (5.45:1), `primary` `#0F3D2E` →
`#15523D` (9.11:1). `pnpm verify:a11y` reads these from the CSS and checks them.

---

## Type

| Face                                | Role            | Source          |
| ----------------------------------- | --------------- | --------------- |
| **Bespoke Serif** ExtraBold         | display         | Fontshare (ITF) |
| **Satoshi**                         | body            | Fontshare (ITF) |
| **Rajdhani** Bold, uppercase, 0.1em | the decal voice | Google Fonts    |

Rajdhani is the honest bridge to the lettering on his car. The real decal is probably
**Eurostile / Square 721 Bold Extended** (CorelDRAW-bundled, standard in Indian vinyl
shops) — commercial, and cheap-looking at body size. Keep Rajdhani to short uppercase
strings: the `.decal` class.

Fontshare's ITF licence is free-but-closed-source: no Fontsource package exists, so
the fonts load from the Fontshare CDN.

Body copy caps at 64ch (`.measure`), pull-quotes at 46ch (`.measure-tight`).

---

## Motion

Curves: `--ease-out-strong: cubic-bezier(.23, 1, .32, 1)` for entrances and hovers,
`--ease-in-out-strong: cubic-bezier(.77, 0, .175, 1)` for on-screen movement.

**Nothing uses `ease-in`** — it delays the first frame, the exact moment the eye is
watching, so it reads slower at the same duration.

| Element       | Treatment                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Scroll reveal | opacity + 8px rise, 500ms, once                                                                                                    |
| Stagger       | 60ms between children                                                                                                              |
| Press         | `scale(0.97)`, 160ms                                                                                                               |
| Hover         | 1px lift + shadow + colour, gated behind `(hover: hover)`                                                                          |
| Image hover   | `scale(1.04)`, 600ms, clipped by `.img-frame`                                                                                      |
| Nav           | background cross-fades on **opacity alone** — animating `padding` and `backdrop-filter` forced layout every frame and read as jank |
| Marquee       | 44s linear, **decorative content only**                                                                                            |

Auto-moving text people must read is a WCAG failure. The marquee carries place-name
chips and nothing else.

`prefers-reduced-motion` stops all of it: nothing hidden, marquee halted, transitions
instant.

---

## Components

| Class                                         | Does                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `.btn`                                        | transform + shadow + background transitions; `:active` scales to 0.97 |
| `.btn-primary` / `.btn-accent` / `.btn-ghost` | hover colours, darkening not lightening                               |
| `.link-inline`                                | inline link with a 44px `::after` hit area on coarse pointers         |
| `.reveal` / `.reveal-child`                   | scroll reveal, gated behind `[data-reveal-ready]`                     |
| `.img-frame`                                  | clips the hover zoom                                                  |
| `.rail`                                       | scroll-snap carousel with edge bleed, zero JS                         |
| `.marquee`                                    | masked, pauses on hover, stops under reduced motion                   |
| `.sticky-col`                                 | `position: sticky` at ≥1024px                                         |
| `.decal`                                      | the Rajdhani voice                                                    |

**The fleet card's divider.** In `Vehicles.astro` the "who it suits" paragraph carries
`flex-1` and the note carries a fixed `mt-5` plus `min-h-[4.5rem]`. That looks odd —
`flex-1` on a paragraph usually is — so: the note used to carry `mt-auto`, which turns
every card's leftover height into margin _above_ the rule. The card with the longest
copy had no leftover height and so no gap, and its rule sat flush against the text
while the others floated. Making the suits paragraph the flexible one moves the slack
above the divider instead of into it, and the reserved note height keeps all the rules
at the same Y when one note wraps to an extra line.

**`.reveal` is gated on `[data-reveal-ready]`**, set by the script. Without that gate a
blocked or slow script left the page blank — content must never depend on JS to become
visible.

---

## The floor, enforced

- every text pair ≥ AA, most AAA, **including hover states**
- all pairs survive protanopia and deuteranopia simulation
- 3px focus ring on every control, never removed
- 44px minimum tap target on coarse pointers
- no horizontal overflow at 320 / 390 / 1440
- the page renders fully with JavaScript disabled
- zero separate `.js` files in `dist/`

`pnpm verify` checks all of it.

## Icons

### UI icons — `src/components/icons/`

One `.astro` component per glyph. Two exist: `WhatsApp.astro` and `Phone.astro`.

```astro
<WhatsAppIcon /> <!-- 20px, the default -->
<WhatsAppIcon size={15} /> <!-- the nav -->
<PhoneIcon size={18} /> <!-- beside a 20px WhatsApp glyph -->
```

The contract, and it is not optional:

- **`aria-hidden="true"`, always.** Every call site keeps its visible text label, so
  the glyph repeats what the words already say. `pnpm verify:aria` fails any link
  whose entire content is aria-hidden — that gate is what stops a call site dropping
  the text and shipping a button that announces nothing.
- **`fill="currentColor"`.** The glyph inherits the button's text colour, so one
  component is correct on accent, on primary and on the light band. It also means an
  icon can never reach for brand red, which `verify-content` counts.
- **`size` is a number, not a class** — it sets the `width`/`height` attributes, the
  way the glyphs were originally written inline.

| Context                | Size | Why                                           |
| ---------------------- | ---- | --------------------------------------------- |
| Nav Call / Book        | 15   | the tightest row on the site                  |
| Stays inline text link | 16   | optically matches `text-base` body copy       |
| `btn-primary` CTAs     | 18   | 20 dominates at `py-3.5`                      |
| Hero / Contact buttons | 20   | the largest buttons, 4rem of vertical padding |

**Where the art comes from.** `src/components/icons/source/` holds each glyph's
original file as downloaded, and the component is that path and nothing else.
WhatsApp's is the official mark from [Simple Icons](https://simpleicons.org), which
is **CC0** — public domain, no attribution required, commercial use fine. Re-download
it rather than hand-editing the path.

That rule was written after the opposite happened. The glyph started as a
hand-simplified path inlined in `Hero.astro`, which drew the handset as its own
filled shape instead of a cut-out; at 16–20px the detail filled in and the mark read
as a generic speech bubble. A brand mark nobody recognises is worse than no mark,
because it costs the same space and says nothing.

**Why components rather than inline SVG.** The glyph lived in `Hero.astro` and
nowhere else, so five of the six WhatsApp calls-to-action said "WhatsApp" in words
and drew nothing — the one mark every Indian phone user recognises on sight, missing
from five of the six places the decision gets made. Copying the path six times would
have been six chances to drift, which is exactly what happened to the `.ico` and the
apple-touch icon before `pnpm icons` existed.

They are compile-time only: Astro inlines them into the HTML at build, so they ship
zero bytes of JavaScript and the zero-JS gate stays green.

### Raster icons

`public/favicon.svg` is the canonical source for every raster icon. Run `pnpm icons`
to regenerate them; never hand-edit a PNG or the `.ico`.

| File                   | Size     | Used by                        |
| ---------------------- | -------- | ------------------------------ |
| `favicon.svg`          | vector   | modern browsers                |
| `favicon.ico`          | 16/32/48 | tab icon, legacy browsers      |
| `apple-touch-icon.png` | 180      | iOS home screen                |
| `icon-192.png`         | 192      | Android launcher               |
| `icon.png`             | 512      | PWA / manifest, incl. maskable |

**Why a generator exists.** The `.ico` and the apple-touch icon had drifted into two
different drawings: the `.ico` carried the solid white D that `favicon.svg` defines,
while the touch icon had been produced from `Logo.astro` and rendered as a thin hollow
outline. Same mark, two shapes.

The raster source is `favicon.svg`, **not** `Logo.astro`. The SVG is deliberately
thickened to survive 16px; `Logo.astro` is drawn for a page at full size and its
hairlines disappear when scaled down. They are not interchangeable.

Rendering goes through headless Chrome, so the SVG is rasterised by the same engine
that displays it. The script launches its own browser — unlike `pnpm og`, it needs no
preview server. Output is deterministic: re-running produces byte-identical files.

## Prose (legal pages)

`@tailwindcss/typography` is loaded CSS-first — `@plugin "@tailwindcss/typography";`
in `global.css`, no `tailwind.config.js` (that is the Tailwind-3 legacy path this
project deliberately avoids).

Every `--tw-prose-*` variable is remapped to a project token, so the plugin keeps
owning the hard part — vertical rhythm, list indentation, its specificity-zero
`:where()` wrapper — and we own only colour and type:

| Prose variable                              | Token                      |
| ------------------------------------------- | -------------------------- |
| `--tw-prose-body`, `-bold`, `-headings`     | `--color-foreground`       |
| `--tw-prose-links`                          | `--color-accent-ink`       |
| `--tw-prose-lead`, `-captions`, `-counters` | `--color-muted-foreground` |
| `--tw-prose-bullets`, `-th-borders`         | `--color-border`           |
| `--tw-prose-hr`, `-quote-borders`           | `--color-rule`             |

Two rules that are easy to get wrong:

- **Links use `--color-accent-ink`, never `--color-accent`.** `accent` is the button
  fill; as body-size text it misses 4.5:1. `accent-ink` is the text-safe accent at
  5.46:1.
- **Bullets use `--color-border`, not `--color-rule`.** A bullet is a graphic you have
  to see, so the 3:1 non-text floor applies; `--color-rule` is the decorative hairline
  and is too faint.

`.prose :is(h2, h3, h4, h5, h6)` re-asserts `--font-display`. This file styles only
`h1`–`h3`, and the legal renderer shifts every editor heading one level down — so an
editor's third-level heading becomes an `<h4>` and would otherwise inherit nothing: no
display face, no tightened leading, barely larger than body text. Correct for a screen
reader, invisible to a reader.

None of this can reach the homepage: the plugin's rules all sit inside
`:where(.prose …)` (specificity 0) and the variable definitions live on `.prose`
itself. `verify:a11y` is unaffected, because it matches `--color-*: #hex` pairs and
these are `--tw-prose-*` with `var()` values.

## Page bands and the river edge

**Every light↔dark edge is a river bend. Never a straight cut.** This is the
house style's one hard "no", and it applies to every page — the homepage, the
legal pages, and anything added later.

```astro
import RiverDivider from '../components/RiverDivider.astro';
<RiverDivider from="deep" to="bg" /> <!-- dark  -> light -->
<RiverDivider from="bg" to="deep" /> <!-- light -> dark  -->
<RiverDivider from="bg" to="primary" size="lg" flip />
```

### Props

| Prop    | Type                                     | Default | Notes                                            |
| ------- | ---------------------------------------- | ------- | ------------------------------------------------ |
| `from`  | `'bg' \| 'muted' \| 'primary' \| 'deep'` | —       | The band **above**. A raw hex also works.        |
| `to`    | same                                     | —       | The band **below**; the water is filled with it. |
| `size`  | `'sm' \| 'md' \| 'lg'`                   | `'md'`  | Bend depth. `md` is the homepage value.          |
| `flip`  | `boolean`                                | `false` | Mirrors the bend vertically.                     |
| `class` | `string`                                 | `''`    | Passed to the wrapper.                           |

`from`/`to` take a **semantic band name**, not a colour. Naming the band is what
stops a page hardcoding `#082219` and quietly disagreeing with the token the
section beside it actually paints.

### The band colours

They live in `src/styles/bands.ts` as `BAND`, mirroring `@theme` in `global.css`:

| Key       | Token                  | Value     |
| --------- | ---------------------- | --------- |
| `bg`      | `--color-background`   | `#FCFBF7` |
| `muted`   | `--color-muted`        | `#EEF2ED` |
| `primary` | `--color-primary`      | `#0F3D2E` |
| `deep`    | `--color-primary-deep` | `#082219` |

**Why hex and not `var(--color-…)`:** the divider paints an SVG `fill`, and an
SVG attribute cannot read a CSS custom property — `fill="var(--color-bg)"`
renders nothing. The literal has to reach the element, so `BAND` is how it gets
there from one place instead of four.

That makes `bands.ts` a second copy of four tokens, which is exactly the kind of
duplicate that drifts. `pnpm verify:content` parses both files and fails if they
disagree, so the copy cannot silently fall behind the stylesheet. That check is
what licenses the hex literals.

### Pattern for any new page

1. Dark header band (so the white nav is readable at scroll-0 — it is transparent
   until `Motion` sets `data-stuck`).
2. `<RiverDivider from="deep" to="bg" />`
3. The page's light content.
4. `<RiverDivider from="bg" to="deep" />`
5. `<Contact />`, which carries the NAP, the CTAs and the footer.

`verify:content` fails a page that has a dark band and no bend.
