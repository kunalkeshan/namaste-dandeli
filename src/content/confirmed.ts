/**
 * THE CONFIRMED-FACT GUARD
 *
 * A claim about Irshad's business is either confirmed by him or it is
 * not. An unconfirmed claim must be *unrenderable* — not merely
 * flagged, because a flag nobody reads is not a guard.
 *
 * This replaces three ad-hoc mechanisms that had drifted apart:
 *   - `routes.verified`      worked (the UI gated on it)
 *   - `site.hoursConfirmed`  DEAD — no component read it, so an
 *                            unconfirmed "24 hours, every day" was
 *                            rendering on the live page
 *   - `ownPhotos.ready`      DEAD the same way
 *
 * The union below makes that impossible: an unconfirmed value has no
 * `value` property at all, so a component physically cannot print the
 * claim. The type system enforces the honesty rule.
 */

export type Confirmed<T> =
  | { confirmed: true; value: T; confirmedOn: string; source?: string }
  | { confirmed: false; fallback: string; blocker: string };

/** A fact Irshad (or a primary source) has confirmed. */
export function confirmed<T>(
  value: T,
  confirmedOn: string,
  source?: string,
): Confirmed<T> {
  return { confirmed: true, value, confirmedOn, source };
}

/**
 * A fact we do NOT have. `fallback` is what the page shows instead —
 * it must be honest on its own, never a softened version of the
 * unconfirmed claim. `blocker` is the question to put to Irshad; the
 * launch runbook is generated from these strings.
 */
export function unconfirmed<T>(fallback: string, blocker: string): Confirmed<T> {
  return { confirmed: false, fallback, blocker };
}

/** The value if confirmed, otherwise the honest fallback. */
export function render<T>(fact: Confirmed<T>, format?: (v: T) => string): string {
  if (!fact.confirmed) return fact.fallback;
  return format ? format(fact.value) : String(fact.value);
}

/** Narrowing helper, for components that omit a block entirely. */
export function isConfirmed<T>(
  fact: Confirmed<T>,
): fact is Extract<Confirmed<T>, { confirmed: true }> {
  return fact.confirmed;
}

/** Collects every outstanding blocker for the launch runbook. */
export function blockers(
  facts: Record<string, Confirmed<unknown>>,
): { field: string; blocker: string }[] {
  return Object.entries(facts)
    .filter(([, f]) => !f.confirmed)
    .map(([field, f]) => ({
      field,
      blocker: (f as Extract<Confirmed<unknown>, { confirmed: false }>).blocker,
    }));
}
