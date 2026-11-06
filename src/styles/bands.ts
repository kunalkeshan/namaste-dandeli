/**
 * Band colours, for the one thing CSS variables cannot do.
 *
 * `RiverDivider` paints an inline SVG `fill`, and an SVG attribute
 * cannot read a Tailwind `@theme` token — so the divider needs the
 * literal hex on both sides to sit flush against each band without a
 * seam.
 *
 * These four values were hardcoded in `index.astro`, which meant the
 * site's palette had two sources of truth: `@theme` in global.css, and
 * a block of constants in a page. Changing a token there would have
 * left every divider painting the OLD colour against the NEW band — a
 * visible seam, and nothing would have failed. (`MUTED` was already
 * dead there, declared and never used.)
 *
 * MUST MIRROR `@theme` IN global.css EXACTLY.
 * `pnpm verify:content` parses both and fails if they drift, so this
 * file cannot silently fall behind the stylesheet.
 */
export const BAND = {
  /** --color-background — warm paper */
  bg: '#FCFBF7',
  /** --color-muted — cards, alternating bands */
  muted: '#EEF2ED',
  /** --color-primary — the forest */
  primary: '#0F3D2E',
  /** --color-primary-deep — deepest field, hero and footer */
  deep: '#082219',
} as const;

export type BandColour = (typeof BAND)[keyof typeof BAND];
