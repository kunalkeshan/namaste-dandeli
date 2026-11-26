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
  routeStops: RouteStop[];
  /** Matches route.from on a route document for distance lookup. */
  routeRefFrom?: string;
  blocker?: string;
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
