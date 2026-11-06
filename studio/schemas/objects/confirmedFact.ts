import { defineField, defineType } from 'sanity';

/**
 * THE CONFIRMED-FACT GUARD, as a Sanity object.
 *
 * Mirrors `src/content/confirmed.ts`. A claim about Irshad's business
 * is either confirmed by him or it is not, and an unconfirmed claim
 * must be unrenderable.
 *
 * Sanity cannot express a discriminated union — it stores one flat
 * object with every key present. The structural guarantee is restored
 * at the adapter boundary (`narrowConfirmed` in src/content/index.ts),
 * which rebuilds the union and OMITS `value` entirely when the fact is
 * unconfirmed. Validation here is editor UX; the adapter is the real
 * gate, because content written through the MCP skips these rules.
 *
 * `fallback` must be honest on its own — never a softened version of
 * the unconfirmed claim. "Call to check availability", not "usually
 * available 24/7".
 */
const rules = (f: Record<string, unknown> | undefined) => {
  if (!f) return true;
  if (f.confirmed) {
    if (!f.value) return 'Confirmed facts need a value — or untick Confirmed.';
    if (!f.confirmedOn) return 'Record the date Irshad confirmed this.';
    return true;
  }
  if (!f.fallback)
    return 'Unconfirmed facts need a fallback — what the page shows instead.';
  if (!f.blocker)
    return 'Unconfirmed facts need a blocker — the question to put to Irshad.';
  return true;
};

export const confirmedFact = defineType({
  name: 'confirmedFact',
  title: 'Confirmed fact',
  type: 'object',
  fields: [
    defineField({
      name: 'confirmed',
      title: 'Confirmed by Irshad',
      type: 'boolean',
      initialValue: false,
      description:
        'Until this is ticked, the page shows the fallback and never the claim.',
    }),
    defineField({
      name: 'value',
      title: 'The fact',
      type: 'string',
      hidden: ({ parent }) => !parent?.confirmed,
    }),
    defineField({
      name: 'confirmedOn',
      title: 'Confirmed on',
      type: 'date',
      hidden: ({ parent }) => !parent?.confirmed,
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Where it came from — "Irshad, WhatsApp", "Google Maps", etc.',
      hidden: ({ parent }) => !parent?.confirmed,
    }),
    defineField({
      name: 'fallback',
      title: 'Fallback shown instead',
      type: 'string',
      hidden: ({ parent }) => parent?.confirmed,
    }),
    defineField({
      name: 'blocker',
      title: 'Question for Irshad',
      type: 'text',
      rows: 2,
      hidden: ({ parent }) => parent?.confirmed,
    }),
  ],
  validation: (Rule) => Rule.custom(rules),
});

/** Route distances: the value is a measured {km, drive} pair. */
export const confirmedDistance = defineType({
  name: 'confirmedDistance',
  title: 'Confirmed distance',
  type: 'object',
  fields: [
    defineField({ name: 'confirmed', type: 'boolean', initialValue: false }),
    defineField({
      name: 'km',
      title: 'Kilometres',
      type: 'number',
      hidden: ({ parent }) => !parent?.confirmed,
    }),
    defineField({
      name: 'drive',
      title: 'Drive time',
      type: 'string',
      description: 'Human phrasing, e.g. "1 hr 45 min".',
      hidden: ({ parent }) => !parent?.confirmed,
    }),
    defineField({
      name: 'confirmedOn',
      type: 'date',
      hidden: ({ parent }) => !parent?.confirmed,
    }),
    defineField({
      name: 'source',
      type: 'string',
      hidden: ({ parent }) => !parent?.confirmed,
    }),
    defineField({
      name: 'fallback',
      type: 'string',
      hidden: ({ parent }) => parent?.confirmed,
    }),
    defineField({
      name: 'blocker',
      type: 'text',
      rows: 2,
      hidden: ({ parent }) => parent?.confirmed,
    }),
  ],
  validation: (Rule) =>
    Rule.custom((f) => {
      if (!f) return true;
      if (f.confirmed) {
        if (typeof f.km !== 'number') return 'A confirmed distance needs a measured km.';
        if (!f.drive) return 'A confirmed distance needs a drive time.';
        if (!f.confirmedOn) return 'Record the date this was measured.';
        return true;
      }
      if (!f.fallback) return 'Unmeasured routes need a fallback, e.g. "Ask the fare".';
      if (!f.blocker) return 'Unmeasured routes need a blocker.';
      return true;
    }),
});
