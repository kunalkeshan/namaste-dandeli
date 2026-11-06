import { defineArrayMember, defineType } from 'sanity';

/**
 * Rich text, for legal prose only.
 *
 * THE HEADING CONTRACT: a Heading 1 here renders as an `<h2>` on the
 * page. Every legal page already has an `<h1>` — the document's own
 * `title` field — and two `<h1>`s on one page is an accessibility
 * defect, so the renderer shifts every level down by one
 * (H1 -> h2, H2 -> h3, H3 -> h4). See src/components/portable-text/.
 * The field description in `legalPage` repeats this, because the
 * editor needs to know it at the moment they pick a style.
 *
 * Numbered lists are included deliberately. The equivalent schema in
 * v2.kunalkeshan.dev offers only bullets, which is fine for a journal
 * entry and wrong for a document with numbered clauses.
 *
 * No image member, for two reasons: legal prose has no use for one,
 * and an image here would need the `hotspot`/`crop` projection that
 * `src/content/sanity.ts` warns about — a four-field rule that is easy
 * to get subtly wrong and silently degrades to a centre crop.
 */
export const blockContent = defineType({
  name: 'blockContent',
  title: 'Content',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading 1 (renders as h2)', value: 'h1' },
        { title: 'Heading 2 (renders as h3)', value: 'h2' },
        { title: 'Heading 3 (renders as h4)', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [
        { title: 'Bullet', value: 'bullet' },
        { title: 'Numbered', value: 'number' },
      ],
      marks: {
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
        ],
        annotations: [
          {
            title: 'Link',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
                validation: (Rule) => Rule.required(),
              },
            ],
          },
        ],
      },
    }),
  ],
});
