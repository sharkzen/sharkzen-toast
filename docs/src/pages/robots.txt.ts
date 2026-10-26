import type { APIRoute } from 'astro'

// Note: crawlers only read robots.txt from the domain root, so on a GitHub Pages
// project site this file is informational; the sitemap is still discovered via
// Search Console. It starts working as-is once a custom domain is attached.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const sitemap = new URL(`${base}/sitemap-index.xml`, site)
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
