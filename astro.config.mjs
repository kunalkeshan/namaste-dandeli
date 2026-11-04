// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * `site` drives every absolute URL: canonical, og:image, og:url and
 * the sitemap (which @astrojs/sitemap will not emit at all without
 * it).
 *
 * The order below matters, and the default is deliberately NOT the
 * production domain. Hardcoding namastedandeli.com meant the live
 * Vercel deployment advertised og:image at a domain that does not
 * resolve yet — WhatsApp fetched it, got a 404, and fell back to the
 * favicon. Falling back to the deployment's own URL means previews
 * and the pre-domain production site both describe themselves
 * correctly.
 *
 *   1. SITE_URL              — set this once the domain is live
 *   2. VERCEL_PROJECT_PRODUCTION_URL — stable prod URL on Vercel
 *   3. VERCEL_URL            — the per-deployment preview URL
 *   4. localhost             — local builds
 */
const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const vercelAny = process.env.VERCEL_URL;
const SITE =
  process.env.SITE_URL ??
  (vercelProd && `https://${vercelProd}`) ??
  (vercelAny && `https://${vercelAny}`) ??
  'http://localhost:4321';

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
