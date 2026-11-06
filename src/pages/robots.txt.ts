import type { APIRoute } from 'astro';

/**
 * robots.txt, generated rather than committed.
 *
 * It was a static file in `public/` with the sitemap URL hardcoded to
 * https://namastedandeli.com — a domain that does not resolve yet. That
 * is the same defect `astro.config.mjs` documents for og:image: a
 * preview deploy advertised a sitemap on a dead host, so the one line in
 * the file that has to be absolute was the one line that was wrong.
 *
 * Generating it from `Astro.site` means the sitemap URL always matches
 * the host actually serving the file — localhost in dev, the preview URL
 * on a Vercel preview, the custom domain in production — with no env var
 * to set and nothing to remember when the domain is attached.
 *
 * The Disallow list mirrors the sitemap `filter` in astro.config.mjs.
 * Both exist because they do different jobs: the filter keeps a page out
 * of the sitemap, Disallow asks crawlers not to fetch it. The legal pages
 * appear in neither list — they are content, and meant to be indexed.
 */
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site ?? 'http://localhost:4321');

  const body = `User-agent: *
Allow: /

# The OG card and style guide are not content pages.
Disallow: /og
Disallow: /styleguide

Sitemap: ${sitemap.href}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
