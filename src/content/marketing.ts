/**
 * SEO / marketing pages — publish gate (same pattern as legal.ts).
 *
 * A page exists only when published is true AND the fields that make
 * it non-doorway are present. MCP writes skip Studio validation, so
 * the adapter is the real gate.
 */
import type { Img } from './sanity';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PageSection {
  heading?: string;
  body: string;
}

export interface PageQuote {
  author: string;
  text: string;
  pull?: string;
  dateLabel?: string;
}

export interface RouteStop {
  name: string;
  note?: string;
  lat?: number;
  lng?: number;
  promoteSlug?: string;
}

export interface MarketingPage {
  section: 'things-to-do' | 'routes' | 'stays';
  slug: string;
  title: string;
  description: string;
  pageTitle: string;
  eyebrow?: string;
  lede: string;
  sections: PageSection[];
  faqs: FaqItem[];
  quotes: PageQuote[];
  whatsappMessage: string;
  enquiryTopic: string;
  heroImage: Img | null;
  cardImage: Img | null;
  routeStops: RouteStop[];
  /** Matches route.from on a route document for distance lookup. */
  routeRefFrom?: string;
  activityName?: string;
  stayKind?: string;
  alongTheWay?: string;
  blocker?: string;
}

/** Homepage activity name → marketing slug (published pages only). */
export const ACTIVITY_MARKETING_SLUG: Record<string, string> = {
  'White water rafting': 'white-water-rafting',
  'Jungle safari': 'jungle-safari',
  'Coracle ride': 'coracle-ride',
  Birdwatching: 'birdwatching',
  'Syntheri Rocks': 'syntheri-rocks',
  'Supa Dam & Sykes Point': 'supa-dam-sykes-point',
};

export const ROUTE_MARKETING_SLUG: Record<string, string> = {
  'Hubballi Airport (HBX)': 'hubballi-airport',
  'Hubballi city & station': 'hubballi-city',
  'Alnavar Junction': 'alnavar-junction',
  'Londa Junction': 'londa-junction',
  'Belagavi Airport (IXG)': 'belagavi-airport',
  'Dabolim Airport, Goa (GOI)': 'dabolim-goa',
};

export const STAY_MARKETING_SLUG: Record<string, string> = {
  'On the river': 'on-the-river',
  'In the trees': 'in-the-trees',
  'Pool & family': 'pool-and-family',
};

export function marketingChildUrl(
  published: MarketingPage[],
  section: MarketingSection,
  slug: string,
): string | null {
  const hit = published.find((p) => p.section === section && p.slug === slug);
  return hit ? marketingPath(hit) : null;
}

export function marketingActivityUrl(
  published: MarketingPage[],
  activityName: string,
): string | null {
  const slug = ACTIVITY_MARKETING_SLUG[activityName];
  return slug ? marketingChildUrl(published, 'things-to-do', slug) : null;
}

export function marketingRouteUrl(
  published: MarketingPage[],
  from: string,
): string | null {
  const slug = ROUTE_MARKETING_SLUG[from];
  return slug ? marketingChildUrl(published, 'routes', slug) : null;
}

export function marketingStayUrl(
  published: MarketingPage[],
  kind: string,
): string | null {
  const slug = STAY_MARKETING_SLUG[kind];
  return slug ? marketingChildUrl(published, 'stays', slug) : null;
}

export type MarketingSection = MarketingPage['section'];

export function isMarketingPublished(p: {
  published?: boolean;
  slug?: string | null;
  section?: string | null;
  title?: string | null;
  description?: string | null;
  pageTitle?: string | null;
  lede?: string | null;
}): boolean {
  if (p?.published !== true) return false;
  if (!p.section || !p.slug) return false;
  if (!p.title?.trim() || !p.description?.trim() || !p.pageTitle?.trim()) return false;
  if (!p.lede?.trim()) return false;
  return true;
}

export function marketingPath(page: Pick<MarketingPage, 'section' | 'slug'>): string {
  if (page.slug === 'hub') return `/${page.section}`;
  return `/${page.section}/${page.slug}`;
}
