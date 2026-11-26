import type { Img } from '../content';
import type { MarketingPage } from '../content/marketing';

/** CC BY-SA and other credited photographs on this page only. */
export function photographCredits(imgs: (Img | null | undefined)[]): string[] {
  const out = new Set<string>();
  for (const img of imgs) {
    const c = img?.credit?.trim();
    if (c) out.add(c);
  }
  return [...out];
}

export function imgsOnMarketingPage(
  page: MarketingPage,
  extras: (Img | null | undefined)[] = [],
): Img[] {
  const list: (Img | null | undefined)[] = [page.heroImage, page.cardImage, ...extras];
  return list.filter((i): i is Img => i != null);
}

export function pageShowsRouteMaps(
  page: MarketingPage,
  children?: MarketingPage[],
): boolean {
  if (page.section !== 'routes') return false;
  if (page.routeStops.length >= 2) return true;
  return (children ?? []).some((c) => c.routeStops.length >= 2);
}
