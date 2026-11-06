import { defineField, defineType } from 'sanity';

/**
 * A legal page — the privacy policy, the terms.
 *
 * NOT a confirmedFact, and that is deliberate. `Confirmed<T>` guards
 * MEASURED facts: a drive time, a distance, the opening hours. Its
 * payload is a `blocker` — the question to put to Irshad. Legal prose
 * is authored text, so there is no measurement to confirm and no
 * honest fallback to render in its place.
 *
 * The failure mode it still has to close is a HALF-AUTHORED policy,
 * which is worse than no policy at all. So the gate is publish state
 * instead: the GROQ query filters on `defined(body)`, a page without
 * a body never enters getStaticPaths and so is never built, and the
 * footer links only what exists. `verify-content.mjs` fails the build
 * if a footer link points at a page that was not built.
 *
 * `effectiveDate` is explicit rather than leaning on `_updatedAt`,
 * which the equivalent schema in v2.kunalkeshan.dev does. `_updatedAt`
 * moves when someone fixes a typo — publishing that as the date the
 * terms changed would misrepresent it.
 */
export const legalPage = defineType({
  name: 'legalPage',
  title: 'Legal page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description:
        'The page heading and the footer link text. "Privacy Policy", ' +
        '"Terms and Conditions".',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      description:
        'Drives the /legal/<slug> URL. Press Generate to derive it from the ' +
        'title. Changing it after publishing breaks every existing link to ' +
        'this page, including any Google has indexed.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
      description:
        'One or two sentences. Used as the search-result description and as ' +
        'the lede under the heading.',
      validation: (R) => R.required().max(165),
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective date',
      type: 'date',
      options: { dateFormat: 'D MMMM YYYY' },
      description:
        'Shown under the heading. Change it when the MEANING changes, not ' +
        'when a typo is fixed.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'body',
      type: 'blockContent',
      description:
        'A Heading 1 here renders as an h2 on the page — the title above is ' +
        'the page’s only h1. Without a body this page is not built at all.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta title override',
          type: 'string',
          description: 'Overrides the browser-tab title. Leave empty to use the title.',
          validation: (R) => R.max(65),
        }),
        defineField({
          name: 'noindex',
          title: 'Hide from search engines',
          type: 'boolean',
          initialValue: false,
          description:
            'Keeps the page out of the sitemap and marks it noindex. The page ' +
            'still renders — this does not unpublish it.',
        }),
      ],
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'description' } },
});
