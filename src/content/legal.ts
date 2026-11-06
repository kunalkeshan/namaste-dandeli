/**
 * Legal pages: the types, and the ONE definition of "published".
 *
 * These are deliberately NOT behind `Confirmed<T>`. That guard exists
 * for measured claims about Irshad's business — hours, fares, drive
 * times — and its payload is a `blocker`, the question to put to him.
 * A privacy policy is not a fact awaiting his confirmation; it is a
 * document that either exists or does not.
 *
 * The failure mode still has to close, because a half-written policy
 * is worse than none. So the gate is PUBLISH STATE, and it lives in
 * one function rather than three hand-written `body?.length` checks —
 * because three call sites need the answer (getStaticPaths: build the
 * page? Footer: render the link? verify-content: did those two
 * agree?) and three copies are three chances to drift. `hoursConfirmed`
 * drifted exactly that way.
 */

/** A Portable Text block, narrowed to what the schema can produce. */
export interface LegalBlock {
  _type: string;
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: { _type: string; _key?: string; text?: string; marks?: string[] }[];
  markDefs?: { _type: string; _key: string; href?: string }[];
}

export interface LegalPage {
  title: string;
  slug: string;
  description: string;
  effectiveDate: string | null;
  body: LegalBlock[];
}

/**
 * A legal page is published when it HAS A BODY. Nothing else counts.
 *
 * A title and a slug are what an editor types in the first thirty
 * seconds; the body is the document. An empty body therefore means the
 * page does not exist: it is not built, and no footer link points at
 * it. Building an empty page would be strictly worse than omitting it,
 * because the footer would then advertise a link to nothing — which is
 * the precise defect this whole site exists to fix (his Google
 * listing's website URL returns HTTP 404).
 *
 * The `trim()` matters: a block whose only span is an empty string is
 * what the Studio leaves behind when an editor clears the field, and a
 * bare `body.length > 0` would call that published.
 */
export function isPublished(p: {
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  body?: LegalBlock[] | null;
}): boolean {
  if (!p?.slug || !p.title || !p.description) return false;
  const text = (p.body ?? [])
    .flatMap((b) => b.children ?? [])
    .map((c) => c.text ?? '')
    .join('')
    .trim();
  return text.length > 0;
}
