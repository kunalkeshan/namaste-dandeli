import { defineField, defineType } from 'sanity';

/**
 * An image plus the metadata the honesty rules require.
 *
 * `alt` describes the picture to someone who cannot see it. It is NOT
 * where attribution goes: overloading alt with "— Drashokk, CC BY-SA
 * 4.0, via Wikimedia Commons" degrades the screen-reader experience
 * AND still fails the licence, because sighted users never encounter
 * it. Credits are a separate field, rendered visibly in the footer.
 *
 * `licence` matters because six of the Wikimedia images are CC BY-SA
 * 4.0. Re-hosting them on our own CDN does not change the terms —
 * attribution and share-alike travel with the file. If the credit
 * stops rendering, we are in breach.
 *
 * `subject` drives the stays disclosure check in verify-sanity.mjs:
 * if any 'resort-interior' image renders, the page must not still
 * claim the photographs show the region rather than a property.
 */
export const imageWithMeta = defineType({
  name: 'imageWithMeta',
  title: 'Image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'What the picture shows, for screen readers. Describe it; do not put the credit here.',
      validation: (Rule) =>
        Rule.required().min(10).error('Every image needs real alt text.'),
    }),
    defineField({
      name: 'credit',
      title: 'Credit',
      type: 'string',
      description:
        'Required for CC BY-SA. Rendered in the footer. e.g. "River Kali At Dawn — Vaibhavipakhare, CC BY-SA 4.0, via Wikimedia Commons"',
    }),
    defineField({
      name: 'licence',
      title: 'Licence',
      type: 'string',
      initialValue: 'own',
      options: {
        list: [
          { title: "Irshad's own photograph", value: 'own' },
          { title: 'Illustration commissioned for this site', value: 'illustration' },
          { title: 'CC0 / public domain', value: 'cc0' },
          { title: 'CC BY-SA 4.0 — credit required', value: 'cc-by-sa-4.0' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subject',
      title: 'What it shows',
      type: 'string',
      options: {
        list: [
          { title: 'Irshad himself', value: 'irshad' },
          { title: 'A vehicle', value: 'vehicle' },
          { title: 'The region', value: 'region' },
          { title: 'A partner resort interior or grounds', value: 'resort-interior' },
          { title: 'An activity', value: 'activity' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  validation: (Rule) =>
    Rule.custom((img: Record<string, unknown> | undefined) => {
      if (!img?.asset) return true;
      if (img.licence === 'cc-by-sa-4.0' && !img.credit) {
        return 'CC BY-SA 4.0 requires attribution. Add the credit, or the licence is breached.';
      }
      return true;
    }),
  preview: {
    select: { media: 'asset', title: 'alt', subtitle: 'licence' },
  },
});
