import { defineCliConfig } from 'sanity/cli';

/**
 * Root CLI config — TYPEGEN ONLY.
 *
 * Deliberately carries no `api` block: this config never talks to the
 * Content Lake. It reads the committed schema.json that the Studio
 * emits and generates types for the queries in src/content.
 *
 * The Studio's own sanity.cli.ts owns the project connection and
 * deployment. Two files, disjoint jobs.
 */
export default defineCliConfig({
  typegen: {
    path: './src/**/*.{ts,astro}',
    schema: './schema.json',
    generates: './src/content/sanity.types.ts',
    overloadClientMethods: true,
  },
});
