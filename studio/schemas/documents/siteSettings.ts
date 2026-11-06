import { defineField, defineType } from 'sanity';

/**
 * The business, as a grouped singleton.
 *
 * Grouped rather than a flat wall of fields, mirroring the siteConfig
 * pattern from v2.kunalkeshan.dev — Irshad should see tidy tabs, not
 * thirty inputs in a column.
 *
 * `whatsapp` and `hours` are confirmedFacts: both are currently
 * unconfirmed, and an unconfirmed "24 hours, every day" rendering on
 * the live page is the exact bug the guard was built to stop.
 *
 * Absorbs the page title/description (previously hardcoded in
 * index.astro) and the OG card strings (previously hardcoded in
 * og.astro), so SEO copy finally lives in the content layer.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identity', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'address', title: 'Address' },
    { name: 'google', title: 'Google listing' },
    { name: 'seo', title: 'SEO & social' },
  ],
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      group: 'identity',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'legalName', type: 'string', group: 'identity' }),
    defineField({ name: 'googleName', type: 'string', group: 'identity' }),
    defineField({
      name: 'alsoKnownAs',
      type: 'string',
      group: 'identity',
      description: 'Several reviews call the business "Humsafar Taxi".',
    }),
    defineField({ name: 'owner', type: 'string', group: 'identity' }),
    defineField({ name: 'ownerShort', type: 'string', group: 'identity' }),

    defineField({
      name: 'phone',
      type: 'string',
      group: 'contact',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'phoneDisplay', type: 'string', group: 'contact' }),
    defineField({ name: 'email', type: 'string', group: 'contact' }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp number',
      type: 'confirmedFact',
      group: 'contact',
      description:
        'May differ from the listed phone. Until confirmed, CTAs fall back to it.',
    }),
    defineField({
      name: 'hours',
      title: 'Hours',
      type: 'confirmedFact',
      group: 'contact',
    }),

    defineField({
      name: 'address',
      type: 'object',
      group: 'address',
      fields: [
        defineField({ name: 'street', type: 'string' }),
        defineField({ name: 'locality', type: 'string' }),
        defineField({ name: 'region', type: 'string' }),
        defineField({ name: 'postalCode', type: 'string' }),
        defineField({ name: 'country', type: 'string', initialValue: 'IN' }),
        defineField({ name: 'lat', type: 'number' }),
        defineField({ name: 'lng', type: 'number' }),
      ],
    }),
    defineField({
      name: 'serviceAreas',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'address',
      options: { layout: 'tags' },
    }),

    defineField({
      name: 'google',
      type: 'object',
      group: 'google',
      description:
        'The rating is rendered as visible HTML, never as aggregateRating — Google ignores self-reported ratings and renders nothing.',
      fields: [
        defineField({ name: 'rating', type: 'number' }),
        defineField({
          name: 'reviewCount',
          type: 'number',
          description:
            'The exact count. The page renders it as "160+" — the adapter appends ' +
            'the plus, so enter only the number. The count keeps growing and there ' +
            'is no Places API reading it live, so a stale figure understates it.',
        }),
        defineField({ name: 'placeId', type: 'string' }),
        defineField({ name: 'mapsUrl', type: 'url' }),
        defineField({ name: 'reviewsUrl', type: 'url' }),
      ],
    }),

    defineField({
      name: 'seo',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({ name: 'title', type: 'string', validation: (R) => R.max(65) }),
        defineField({
          name: 'description',
          type: 'text',
          rows: 3,
          validation: (R) => R.max(165),
        }),
        defineField({ name: 'ogTitle', title: 'OG card title', type: 'string' }),
        defineField({ name: 'ogSubtitle', title: 'OG card subtitle', type: 'string' }),
        defineField({ name: 'ogPlace', title: 'OG card place line', type: 'string' }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
});
