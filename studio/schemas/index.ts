import { confirmedFact, confirmedDistance } from './objects/confirmedFact';
import { imageWithMeta } from './objects/imageWithMeta';
import { blockContent } from './objects/blockContent';
import { faqItem } from './objects/faqItem';
import { pageSection } from './objects/pageSection';
import { pageQuote } from './objects/pageQuote';
import { routeStop } from './objects/routeStop';
import { siteSettings } from './documents/siteSettings';
import { legalPage } from './documents/legalPage';
import { marketingPage } from './documents/marketingPage';
import { vehicle, activity, stay, route, review, assurance } from './documents/content';

/** Objects first, then documents — objects must be registered before use. */
export const schemaTypes = [
  confirmedFact,
  confirmedDistance,
  imageWithMeta,
  blockContent,
  faqItem,
  pageSection,
  pageQuote,
  routeStop,
  siteSettings,
  vehicle,
  activity,
  stay,
  route,
  review,
  assurance,
  legalPage,
  marketingPage,
];

/** Types pinned to a fixed document id — see structure.ts and sanity.config.ts. */
export const SINGLETONS = ['siteSettings'] as const;
