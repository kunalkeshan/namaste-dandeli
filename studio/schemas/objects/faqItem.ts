import { defineField, defineType } from 'sanity';

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ',
  type: 'object',
  fields: [
    defineField({
      name: 'question',
      type: 'string',
      validation: (R) => R.required().min(8),
    }),
    defineField({
      name: 'answer',
      type: 'text',
      rows: 4,
      validation: (R) => R.required().min(12),
      description: 'Must match what renders on the page. No unconfirmed fares or times.',
    }),
  ],
  preview: {
    select: { title: 'question', subtitle: 'answer' },
    prepare: ({ title, subtitle }) => ({
      title: title ?? 'FAQ',
      subtitle: subtitle?.slice(0, 60),
    }),
  },
});
