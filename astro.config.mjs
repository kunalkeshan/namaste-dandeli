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
