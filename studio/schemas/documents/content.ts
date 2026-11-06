import { defineField, defineType } from 'sanity';

/** Shared: explicit sort key. GROQ guarantees no order without one. */
const order = defineField({
  name: 'order',
  type: 'number',
  description: 'Lower sorts first.',
  validation: (R) => R.required(),
});

export const vehicle = defineType({
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'seats',
      type: 'string',
      description:
        'e.g. "4 passengers". Do not publish a seat count Irshad has not confirmed.',
    }),
    defineField({ name: 'suits', type: 'text', rows: 2 }),
    defineField({ name: 'note', type: 'text', rows: 2 }),
    defineField({
      name: 'photos',
      type: 'array',
      of: [{ type: 'imageWithMeta' }],
      description:
        'Photos live on the vehicle itself — no more keying into a shared image map.',
      validation: (R) => R.min(1),
    }),
    order,
  ],
  preview: { select: { title: 'name', subtitle: 'seats', media: 'photos.0' } },
});

export const activity = defineType({
  name: 'activity',
  title: 'Activity',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'blurb', type: 'text', rows: 3 }),
    defineField({ name: 'duration', type: 'string' }),
    defineField({ name: 'season', type: 'string' }),
    defineField({
      name: 'caveat',
      type: 'string',
      description:
        'An honest caveat, shown in smaller type. Never promise a sighting or a date.',
    }),
    defineField({ name: 'photos', type: 'array', of: [{ type: 'imageWithMeta' }] }),
    order,
  ],
  preview: { select: { title: 'name', subtitle: 'duration', media: 'photos.0' } },
});

export const stay = defineType({
  name: 'stay',
  title: 'Stay',
  type: 'document',
  description: 'Grouped by what the stay is LIKE. Never name a partner resort.',
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      description: 'e.g. "On the river". A KIND, never a property name.',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'blurb', type: 'text', rows: 3 }),
    defineField({ name: 'photos', type: 'array', of: [{ type: 'imageWithMeta' }] }),
    order,
  ],
  preview: { select: { title: 'kind', media: 'photos.0' } },
});

export const route = defineType({
  name: 'route',
  title: 'Route',
  type: 'document',
  fields: [
    defineField({ name: 'from', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'to', type: 'string', initialValue: 'Dandeli' }),
    defineField({
      name: 'distance',
      type: 'confirmedDistance',
      description: 'A wrong drive time means a customer misses a flight. Measure it.',
    }),
    defineField({ name: 'note', type: 'string' }),
    order,
  ],
  preview: { select: { title: 'from', subtitle: 'to' } },
});

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  description: 'Verbatim from Google. Never edit a customer’s words — typos included.',
  fields: [
    defineField({ name: 'author', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'rating',
      type: 'number',
      initialValue: 5,
      validation: (R) => R.min(1).max(5),
    }),
    defineField({ name: 'date', type: 'date' }),
    defineField({
      name: 'dateLabel',
      type: 'string',
      description: 'As Google shows it, e.g. "a year ago".',
    }),
    defineField({
      name: 'text',
      type: 'text',
      rows: 5,
      description:
        'Exactly as written. "confortable", "Susuki", "bcos" stay — an edited testimonial is a fabricated one.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'role',
      type: 'string',
      description:
        'Why this review earns its place. Each role renders in exactly one place.',
      options: {
        list: [
          'solo-safety',
          'local-knowledge',
          'long-distance',
          'stay-and-transfer',
          'goa-route',
          'trust-and-language',
          'punctuality',
        ].map((v) => ({ title: v, value: v })),
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'pull',
      type: 'string',
      description:
        'Optional short pull-quote. MUST be a contiguous verbatim span of the text above.',
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      initialValue: false,
      description:
        'The one shown beside the booking button. Exactly one review may be featured.',
    }),
    order,
  ],
  validation: (R) =>
    R.custom((doc: Record<string, unknown> | undefined) => {
      const pull = doc?.pull as string | undefined;
      const text = doc?.text as string | undefined;
      if (pull && text && !text.includes(pull)) {
        return 'The pull-quote must appear verbatim inside the review text. Shorten, never reword.';
      }
      return true;
    }),
  preview: { select: { title: 'author', subtitle: 'role' } },
});

export const assurance = defineType({
  name: 'assurance',
  title: 'Solo-travel assurance',
  type: 'document',
  description: 'Safety promises are OMITTED while unconfirmed, never hedged.',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'body', type: 'text', rows: 3 }),
    defineField({ name: 'fact', type: 'confirmedFact' }),
    order,
  ],
  preview: { select: { title: 'title' } },
});
