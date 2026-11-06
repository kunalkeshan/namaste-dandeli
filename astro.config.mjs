// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * `site` drives every absolute URL: canonical, og:image, og:url and
 * the sitemap (which @astrojs/sitemap will not emit at all without
 * it).
 *
 * This is self-configuring — attaching a custom domain in Vercel is
 * enough, no env var to set. Per Vercel's docs,
 * VERCEL_PROJECT_PRODUCTION_URL is "the shortest production custom
 * domain, or vercel.app domain if no custom domain is available",
 * and it is set on preview deployments too, which is exactly what an
 * OG image URL needs. None of these carry the protocol scheme, hence
 * the https:// prefix.
 *
 *   1. SITE_URL                       — manual override, rarely needed
 *   2. VERCEL_PROJECT_PRODUCTION_URL  — becomes the custom domain automatically
 *   3. VERCEL_URL                     — per-deployment preview URL
 *   4. localhost                      — local builds
 *
 * The default was previously hardcoded to namastedandeli.com, a
 * domain that does not resolve yet. Production advertised og:image
 * there, WhatsApp fetched it, got a 404, and fell back to the
 * favicon. Never default this to a domain you do not yet serve.
 *
 * Requires "Automatically expose System Environment Variables" in
 * Project Settings → Environment Variables. It is on by default and
 * confirmed on for this project.
 */
/**
 * `changefreq` is typed as the sitemap package's EnumChangefreq, not a
 * free string, so a bare 'weekly' fails `astro check`. The enum's
 * values ARE these strings; importing the enum would mean depending on
 * `sitemap` directly, which is a transitive dep of @astrojs/sitemap and
 * not ours to import. A narrow cast at the three call sites keeps the
 * dependency list honest.
 */
/** @type {any} */ const WEEKLY = 'weekly';
/** @type {any} */ const MONTHLY = 'monthly';
/** @type {any} */ const YEARLY = 'yearly';

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
      /**
       * Excluded, by exact path rather than substring.
       *
       * This was `page.includes('/og')`, which is a substring test
       * against the FULL URL — so any future page whose path happened
       * to contain "/og" (an `/offers` page, a `/legal/...` slug with
       * those letters) would silently drop out of the sitemap. Exact
       * pathname matching cannot misfire that way.
       *
       * /og is the social card and /styleguide is a dev reference;
       * neither is content anyone should land on from search. The
       * legal pages ARE content and are deliberately included.
       */
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/$/, '');
        return path !== '/og' && path !== '/styleguide';
      },

      /**
       * Priority and change frequency, by page type.
       *
       * @astrojs/sitemap emits a flat 0.5/weekly for every page
       * otherwise, which tells a crawler nothing. The homepage is the
       * page that must rank; the legal pages exist to be findable and
       * almost never change.
       *
       * `lastmod` is the build time, which is honest for a static
       * site: the deployed bytes did change then. Dating a legal page
       * by its Sanity `effectiveDate` would be better still, but the
       * integration has no per-page hook for it, and inventing a date
       * here would be the same sin as an unmeasured number.
       */
      serialize: (item) => {
        const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';
        if (path === '/') {
          return { ...item, priority: 1.0, changefreq: WEEKLY };
        }
        if (path.startsWith('/legal/')) {
          return { ...item, priority: 0.3, changefreq: YEARLY };
        }
        return { ...item, priority: 0.5, changefreq: MONTHLY };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      /**
       * astro-portabletext ships UNBUILT source: its package exports
       * map points at `./lib/index.ts`, and it ships `.astro`
       * components too. Astro externalizes bare-specifier dependencies
       * for SSR by default, and Node cannot import `.ts` or `.astro` —
       * so without this the build fails on an unparseable import that
       * names a file inside node_modules, which reads like a bug in
       * the package rather than a config gap.
       */
      noExternal: ['astro-portabletext'],
    },
  },
});
