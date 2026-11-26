import { defineField, defineType } from 'sanity';

export const marketingPage = defineType({
  name: 'marketingPage',
  title: 'SEO page',
  type: 'document',
  fields: [
    defineField({
      name: 'section',
      type: 'string',
      options: {
        list: [
          { title: 'Things to do', value: 'things-to-do' },
          { title: 'Routes', value: 'routes' },
          { title: 'Stays', value: 'stays' },
        ],
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      type: 'string',
      description: 'URL segment after the section. Use "hub" for the section index.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'published',
      type: 'boolean',
      initialValue: false,
      description: 'Unpublished pages are not built, linked, or in the sitemap.',
    }),
    defineField({
      name: 'blocker',
      type: 'string',
      description: 'Question for Irshad while unpublished.',
    }),
    defineField({
      name: 'title',
      type: 'string',
      description: '<title> / social',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 2,
      validation: (R) => R.max(160),
    }),
    defineField({
      name: 'pageTitle',
      type: 'string',
      description: 'The one <h1>',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'lede', type: 'text', rows: 3, validation: (R) => R.required() }),
    defineField({
      name: 'sections',
      type: 'array',
      of: [{ type: 'pageSection' }],
    }),
    defineField({
      name: 'faqs',
      type: 'array',
      of: [{ type: 'faqItem' }],
    }),
    defineField({
      name: 'quotes',
      type: 'array',
      of: [{ type: 'pageQuote' }],
      validation: (R) => R.max(3),
    }),
    defineField({
      name: 'whatsappMessage',
      type: 'text',
      rows: 4,
      description: 'Prefilled WhatsApp text for this page.',
    }),
    defineField({
      name: 'enquiryTopic',
      type: 'string',
      description: 'Activity or route name for the enquiry hand-off.',
    }),
    defineField({
      name: 'heroImage',
      type: 'imageWithMeta',
    }),
    defineField({
      name: 'routeStops',
      type: 'array',
      of: [{ type: 'routeStop' }],
      description: 'Optional. Diagram renders only when lat/lng exist.',
    }),
    defineField({
      name: 'routeRefFrom',
      type: 'string',
      description: 'Matches a route document `from` for distance lookup.',
    }),
  ],
  preview: {
    select: {
      section: 'section',
      slug: 'slug',
      title: 'pageTitle',
      published: 'published',
    },
    prepare: ({ section, slug, title, published }) => ({
      title: title ?? slug,
      subtitle: `${section}/${slug}${published ? '' : ' · draft'}`,
    }),
  },
});
