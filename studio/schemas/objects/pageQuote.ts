import { defineField, defineType } from 'sanity';

export const pageQuote = defineType({
  name: 'pageQuote',
  title: 'Review quote',
  type: 'object',
  description: 'Verbatim from Google. Never edit the customer’s words.',
  fields: [
    defineField({ name: 'author', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'text',
      type: 'text',
      rows: 4,
      description: 'Full review text, or the span you are quoting from.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'pull',
      type: 'string',
      description: 'Short pull-quote. Must appear verbatim inside text.',
    }),
    defineField({ name: 'dateLabel', type: 'string' }),
  ],
  validation: (R) =>
    R.custom((doc: Record<string, unknown> | undefined) => {
      const pull = doc?.pull as string | undefined;
      const text = doc?.text as string | undefined;
      if (pull && text && !text.includes(pull)) {
        return 'pull must appear verbatim inside text';
      }
      return true;
    }),
});
