import { confirmedFact, confirmedDistance } from './objects/confirmedFact';
import { imageWithMeta } from './objects/imageWithMeta';
import { blockContent } from './objects/blockContent';
import { siteSettings } from './documents/siteSettings';
import { legalPage } from './documents/legalPage';
import { vehicle, activity, stay, route, review, assurance } from './documents/content';

/** Objects first, then documents — objects must be registered before use. */
export const schemaTypes = [
  confirmedFact,
  confirmedDistance,
  imageWithMeta,
  blockContent,
  siteSettings,
  vehicle,
  activity,
  stay,
  route,
  review,
  assurance,
  legalPage,
];

/** Types pinned to a fixed document id — see structure.ts and sanity.config.ts. */
export const SINGLETONS = ['siteSettings'] as const;
