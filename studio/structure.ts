import type { StructureResolver } from 'sanity/structure';
import { SINGLETONS } from './schemas';

/**
 * Singletons are pinned by FIXED documentId.
 *
 * Without this, "Site settings" is an ordinary type: an editor can
 * create a second one, and `*[_id == "siteSettings"][0]` then picks
 * whichever happens to sort first — so the site's phone number
 * depends on document creation order.
 *
 * This pins the EDITING view. sanity.config.ts must also strip the
 * create/duplicate actions and the initial-value template, or the
 * global "+" still makes orphans.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Namaste Dandeli')
    .items([
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site settings'),
        ),
      S.divider(),
      S.documentTypeListItem('vehicle').title('Vehicles'),
      S.documentTypeListItem('activity').title('Activities'),
      S.documentTypeListItem('stay').title('Stays'),
      S.documentTypeListItem('route').title('Routes'),
      S.documentTypeListItem('review').title('Reviews'),
      S.documentTypeListItem('assurance').title('Solo-travel assurances'),
      S.divider(),
      // Catch-all for anything added later and not listed above, so a
      // new type is visible immediately instead of silently missing.
      ...S.documentTypeListItems().filter((i) => {
        const id = i.getId();
        return (
          id &&
          ![
            ...SINGLETONS,
            'vehicle',
            'activity',
            'stay',
            'route',
            'review',
            'assurance',
          ].includes(id)
        );
      }),
    ]);
