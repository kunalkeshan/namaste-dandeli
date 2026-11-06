import type { Confirmed } from './confirmed';

/** What Sanity actually stores: one flat object, every key optional. */
export interface FlatConfirmed<T> {
  confirmed?: boolean | null;
  value?: T | null;
  confirmedOn?: string | null;
  source?: string | null;
  fallback?: string | null;
  blocker?: string | null;
}

/**
 * Narrows Sanity's flat object back into the real Confirmed<T> union.
 *
 * THE DELETION IS LOAD-BEARING. confirmed.ts guarantees that an
 * unconfirmed fact has NO `value` property — that absence is what
 * makes the claim unprintable, and the reason the guard replaced three
 * boolean flags that had silently drifted.
 *
 * Returning `{ confirmed: false, value: undefined }` would type-check
 * at this boundary and then let `fact.value` resolve to undefined at a
 * call site that only checked the boolean. So we construct a fresh
 * object carrying only the keys that branch is allowed to have.
 *
 * Fails CLOSED: anything malformed becomes unconfirmed, never
 * confirmed. An editor who clears a field cannot accidentally publish
 * a claim, and content written through the MCP — which skips Studio
 * validation entirely — still cannot.
 *
 * Throwing is correct here. In a static build it is a red build we see
 * before a customer does, which is the same enforcement model
 * reviews.ts already used.
 */
export function narrowConfirmed<T>(
  raw: FlatConfirmed<T> | null | undefined,
  field: string,
): Confirmed<T> {
  if (raw?.confirmed === true) {
    if (raw.value === null || raw.value === undefined) {
      throw new Error(
        `${field}: marked confirmed in Sanity but carries no value. ` +
          `Studio validation should have caught this — check for an MCP write.`,
      );
    }
    if (!raw.confirmedOn) {
      throw new Error(`${field}: confirmed without a confirmedOn date.`);
    }
    return {
      confirmed: true,
      value: raw.value,
      confirmedOn: raw.confirmedOn,
      ...(raw.source ? { source: raw.source } : {}),
    };
  }
  // An EMPTY fallback is legitimate and load-bearing: the solo-travel
  // assurances render nothing at all while unconfirmed, because a
  // hedged safety promise is worse than none. So only `blocker` is
  // required — it is the question for Irshad, and `pnpm blockers` is
  // generated from it. A missing fallback becomes ''.
  if (raw?.blocker == null || raw.blocker === '') {
    throw new Error(
      `${field}: an unconfirmed fact needs a blocker — the question to put to Irshad. ` +
        `An empty fallback is fine (the section is omitted); a missing blocker is not.`,
    );
  }
  return { confirmed: false, fallback: raw.fallback ?? '', blocker: raw.blocker };
}

/** Route distances carry {km, drive} rather than a single scalar. */
export interface FlatDistance {
  confirmed?: boolean | null;
  km?: number | null;
  drive?: string | null;
  confirmedOn?: string | null;
  source?: string | null;
  fallback?: string | null;
  blocker?: string | null;
}

export function narrowDistance(
  raw: FlatDistance | null | undefined,
  field: string,
): Confirmed<{ km: number; drive: string }> {
  if (raw?.confirmed === true) {
    if (typeof raw.km !== 'number' || !raw.drive) {
      throw new Error(`${field}: confirmed distance missing km or drive time.`);
    }
    if (!raw.confirmedOn) throw new Error(`${field}: confirmed without a date.`);
    return {
      confirmed: true,
      value: { km: raw.km, drive: raw.drive },
      confirmedOn: raw.confirmedOn,
      ...(raw.source ? { source: raw.source } : {}),
    };
  }
  if (!raw?.fallback || !raw?.blocker) {
    throw new Error(`${field}: an unmeasured route needs a fallback and a blocker.`);
  }
  return { confirmed: false, fallback: raw.fallback, blocker: raw.blocker };
}
