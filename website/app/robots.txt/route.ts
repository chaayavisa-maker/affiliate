import { SITE_URL } from '@/lib/site';

export const revalidate = 86400; // Revalidate every day

export async function GET() {
  const robotsTxt = `# AI Tools Hub - Robots.txt
# Allow all crawlers to index our content

User-agent: *
Allow: /

# Specific rules for search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Disallow private/admin areas (if any)
Disallow: /admin/
Disallow: /api/

# Crawl delay for respectful crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${SITE_URL}/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
