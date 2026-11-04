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
appears exactly twice on the page, both inside the logo SVG, and encodes nothing.
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
