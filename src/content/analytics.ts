/**
 * Analytics configuration and the event vocabulary.
 *
 * DELIBERATELY CODE, NOT SANITY. Every other fact on this site lives in
 * the CMS, but a measurement ID is not a claim about Irshad's business
 * awaiting his confirmation — it is configuration. That is the same
 * reasoning `legal.ts` uses for publish state, and the reason the
 * `site.ts` link builders stayed in code (ADR 002: they *derive* from
 * data rather than being data).
 *
 * So this is also NOT `Confirmed<T>`. There is no question to put to
 * Irshad here and nothing for `pnpm blockers` to report.
 *
 * To go live: paste the GA4 measurement ID below and deploy. With the
 * string empty, `Analytics.astro` renders nothing at all — zero added
 * bytes — so this can sit in main until the domain is attached.
 *
 * ONE MORE STEP, and the data is useless without it: `method` and
 * `placement` must be registered as event-scoped custom dimensions in
 * the GA4 UI (Admin -> Custom definitions). GA4 collects unregistered
 * params but never shows them in reports, and registration is NOT
 * retroactive. See docs/launch-runbook.md.
 */

export const analytics = {
  /** GA4 measurement ID, e.g. 'G-XXXXXXXXXX'. Empty = tag disabled. */
  ga4: '',

  /**
   * Microsoft Clarity project ID. Reserved, not yet wired.
   *
   * When it is: add the branch inside `window.track` in
   * Analytics.astro. Do not add a second snippet to a component —
   * the whole point of `track()` is that there is one fan-out point.
   */
  clarity: '',
} as const;

/**
 * How the visitor is trying to reach him.
 *
 * `maps` is an outbound click to his Google Business Profile, which is
 * a goal in its own right: the listing is where the 4.9 stars and 160
 * reviews live, and driving traffic there is worth more than anything
 * on this site.
 */
export type CtaMethod = 'call' | 'whatsapp' | 'maps';

/**
 * WHERE on the page the visitor decided. This is the interesting half
 * of the data — which argument actually closed the booking.
 *
 * Two of these look redundant and are not:
 *
 * `routes_fare` is the "Ask the fare" link in Routes.astro, which
 * renders ONLY when a route distance is still unconfirmed. Its click
 * rate measures what the eight unmeasured routes in `pnpm blockers`
 * are costing in real enquiries — folding it into `routes` would
 * destroy exactly that signal.
 *
 * `contact_nap` is the bare phone number inside <address>, kept as
 * plain text for local SEO. Separating it from the contact buttons
 * shows whether anyone actually uses the NAP block.
 */
export type CtaPlacement =
  | 'nav'
  | 'nav_mobile'
  | 'hero'
  | 'solo'
  | 'routes'
  | 'routes_fare'
  | 'stays'
  | 'fares'
  | 'contact'
  | 'contact_nap'
  | 'reviews';

/**
 * The event names.
 *
 * `contact_click` is NOT `click`: the bare name `click` is reserved by
 * GA4 and would be silently rejected. Do not "simplify" it.
 *
 * Both names and both param names are checked against GA4's limits —
 * 40 chars for a name, 25 params per event, 100 chars per value, and
 * no `_`/`ga_`/`google_`/`firebase_`/`gtag` prefix on a param. Web
 * streams have no cap on distinct event names.
 *
 * `generate_lead` is deliberately absent. GA4 documents it for form
 * submissions and wants `value` + `currency`; this site has no form
 * and no measured value per click, and inventing a rupee figure would
 * breach the same rule that keeps unmeasured drive times off the page.
 * Mark `contact_click` as a key event in the GA4 UI instead — no code
 * change, no fiction.
 */
export const EVENTS = {
  contactClick: 'contact_click',
  sectionView: 'section_view',
} as const;
