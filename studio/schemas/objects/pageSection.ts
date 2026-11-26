import { defineField, defineType } from 'sanity';

export const pageSection = defineType({
  name: 'pageSection',
  title: 'Section',
  type: 'object',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'body', type: 'text', rows: 5, validation: (R) => R.required() }),
  ],
});
