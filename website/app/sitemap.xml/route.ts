import { getAllPosts } from '@/lib/posts';
import { SITE_URL } from '@/lib/site';

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  const posts = getAllPosts();

  // Static pages
  const staticPages = [
    '',
    'blog',
    'tools',
    'about',
    'contact',
    'privacy',
    'affiliate-disclosure',
  ];

  const staticUrls = staticPages
    .map(
      (page) => `
  <url>
    <loc>${SITE_URL}${page ? '/' + page : ''}</loc>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>
`
    )
    .join('');

  // Dynamic blog posts
  const postUrls = posts
    .map(
      (post) => `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}${postUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
