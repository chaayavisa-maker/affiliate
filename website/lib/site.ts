/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SITE CONFIG — single source of truth
 * ─────────────────────────────────────────────────────────────────────────────
 * Change your domain or brand name HERE and nowhere else.
 * Every page, layout, SEO tag, schema, and sitemap reads from this file.
 *
 * After changing SITE_URL in production, also update the SITE_URL environment
 * variable in Vercel (Project → Settings → Environment Variables) so it takes
 * effect at build time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SITE_URL =
  process.env.SITE_URL?.replace(/\/$/, '') ||   // strip trailing slash if set
  'https://affiliate-silk-six.vercel.app';

export const SITE_NAME    = 'AI Tools Hub';
export const SITE_TAGLINE = 'Expert Reviews & Comparisons';
export const SITE_DESC    =
  'Unbiased AI tool reviews, comparisons, and guides. Find the best AI software for writing, coding, design, and productivity.';

export const TWITTER_HANDLE = '@AIToolsHub';       // with @
export const TWITTER_URL    = 'https://twitter.com/AIToolsHub';

export const LOGO_URL   = `${SITE_URL}/logo.png`;
export const AUTHOR_NAME = `${SITE_NAME} Editorial Team`;

/** Full canonical URL for a blog post slug */
export const postUrl = (slug: string) => `${SITE_URL}/blog/${slug}`;
