import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes, SINGLETONS } from './schemas';
import { structure } from './structure';

const singletons: readonly string[] = SINGLETONS;

export default defineConfig({
  name: 'namaste-dandeli',
  title: 'Namaste Dandeli',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Removes singletons from the global "create new" menu.
    templates: (prev) => prev.filter((t) => !singletons.includes(t.schemaType)),
  },
  document: {
    // A singleton is edited, never duplicated, deleted or unpublished.
    actions: (prev, { schemaType }) =>
      singletons.includes(schemaType)
        ? prev.filter(
            (a) => !['duplicate', 'delete', 'unpublish'].includes(a.action ?? ''),
          )
        : prev,
  },
});
