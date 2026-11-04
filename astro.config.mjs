// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * `site` is required for canonical URLs and is what makes the sitemap
 * integration work at all — without it, @astrojs/sitemap emits
 * nothing. Override per-deploy with SITE_URL so Vercel previews
 * generate correct absolute URLs instead of pointing at production.
 */
const SITE = process.env.SITE_URL ?? 'https://namastedandeli.com';

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  compressHTML: true,
  build: {
    // One request instead of two on a page this small.
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      // /og is a social card and /styleguide is a dev reference;
      // neither is content anyone should land on from search.
      filter: (page) => !page.includes('/og') && !page.includes('/styleguide'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
