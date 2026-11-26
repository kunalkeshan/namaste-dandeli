import { defineField, defineType } from 'sanity';

export const routeStop = defineType({
  name: 'routeStop',
  title: 'Route stop',
  type: 'object',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'note', type: 'string' }),
    defineField({
      name: 'lat',
      type: 'number',
      description: 'WGS84 latitude. Do not guess — look up once.',
    }),
    defineField({ name: 'lng', type: 'number' }),
    defineField({
      name: 'promoteSlug',
      type: 'string',
      description: 'Published marketing page slug under things-to-do/, if any.',
    }),
  ],
});
