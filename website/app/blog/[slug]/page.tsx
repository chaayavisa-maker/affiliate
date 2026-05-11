import { getAllPosts, getPostBySlug, extractToc } from '@/lib/posts';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Table, Thead, Th, Td, Tr } from '@/components/mdx/Table';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import ReadingProgress from '@/components/ReadingProgress';
import TableOfContents from '@/components/TableOfContents';
import NewsletterForm from '@/components/NewsletterForm';
import { SITE_URL, AUTHOR_NAME, postUrl as sitePostUrl } from '@/lib/site';

interface Props { params: { slug: string } }

const CAT: Record<string, {
  icon: string; label: string; color: string;
  topTool: { name: string; desc: string; url: string; cta: string; note: string }
}> = {
  writing: {
    icon: '✍️', label: 'AI Writing', color: 'from-violet-100 to-purple-100',
    topTool: { name: 'Jasper AI', desc: 'Best overall AI writing tool for teams and agencies.', url: 'https://www.jasper.ai', cta: 'Try Jasper Free 7 Days →', note: '7-day free trial · No credit card required' },
  },
  coding: {
    icon: '💻', label: 'AI Coding', color: 'from-blue-100 to-cyan-100',
    topTool: { name: 'GitHub Copilot', desc: 'Top-rated AI coding assistant trusted by millions.', url: 'https://github.com/features/copilot', cta: 'Start Free Trial →', note: '30-day free trial available' },
  },
  design: {
    icon: '🎨', label: 'AI Design', color: 'from-pink-100 to-rose-100',
    topTool: { name: 'Adobe Firefly', desc: 'Commercially safe AI image generation.', url: 'https://adobe.com/products/firefly', cta: 'Try Firefly Free →', note: 'Included with Creative Cloud plans' },
  },
  chatbots: {
    icon: '💬', label: 'AI Chatbots', color: 'from-green-100 to-emerald-100',
    topTool: { name: 'ChatGPT Plus', desc: 'Most capable AI assistant — GPT-4o, plugins, and more.', url: 'https://chat.openai.com', cta: 'Get ChatGPT Plus →', note: '$20/month · Cancel anytime' },
  },
  video: {
    icon: '🎬', label: 'AI Video', color: 'from-orange-100 to-amber-100',
    topTool: { name: 'Runway ML', desc: 'Most capable AI video generation platform.', url: 'https://runwayml.com', cta: 'Try Runway Free →', note: 'Free tier available' },
  },
  productivity: {
    icon: '⚡', label: 'AI Productivity', color: 'from-yellow-100 to-lime-100',
    topTool: { name: 'Notion AI', desc: 'AI built directly into your notes, docs, and wikis.', url: 'https://notion.so', cta: 'Try Notion AI →', note: 'Add-on: $10/month per user' },
  },
};

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedDate,
    },
  };
}


export default function PostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const related = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);

  const catMeta = CAT[post.category];
  const toc = extractToc(post.content);

  // Format dates honestly: show published + last updated if different
  const publishedFmt = format(new Date(post.date), 'MMMM d, yyyy');
  const updatedFmt = format(new Date(post.updatedDate), 'MMMM d, yyyy');
  const showUpdated = post.updatedDate !== post.date;

  const postUrl = sitePostUrl(post.slug);

  return (
    <>
      <ReadingProgress />

      {/* JSON-LD structured data — extracted from MDX schema export */}
      {post.schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: post.schemaJson }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1fr_300px] gap-12">

          {/* ── Article ── */}
          <article>
            {/* Breadcrumb */}
            <nav className="text-sm text-slate-400 mb-6 flex items-center gap-1.5 flex-wrap">
              <a href="/" className="hover:text-slate-600 transition-colors">Home</a>
              <span>/</span>
              <a href="/blog" className="hover:text-slate-600 transition-colors">Reviews</a>
              <span>/</span>
              <span className="text-slate-600 capitalize">{catMeta?.label ?? post.category}</span>
            </nav>

            {/* Category banner */}
            <div className={`bg-gradient-to-br ${catMeta?.color ?? 'from-slate-100 to-gray-100'} rounded-2xl h-48 flex items-center justify-center text-7xl mb-8`}>
              {catMeta?.icon ?? '🤖'}
            </div>

            {/* Header */}
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1 rounded-full capitalize">
                  {catMeta?.label ?? post.category}
                </span>
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4" style={{fontFamily:'Sora,sans-serif'}}>
                {post.title}
              </h1>
              <p className="text-lg text-slate-500 mb-5">{post.description}</p>

              {/* Meta row — dates + reading time */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 pb-6 border-b border-slate-100">
                <span>Published {publishedFmt}</span>
                {showUpdated && (
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Updated {updatedFmt}
                  </span>
                )}
                <span>·</span>
                <span>{post.readingTime}</span>
              </div>

              {/* Author byline */}
              <div className="flex items-center gap-3 mt-5 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  AI
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{AUTHOR_NAME}</p>
                  <p className="text-xs text-slate-400">Hands-on testing · Updated when tools change</p>
                </div>
                <a href="/about" className="ml-auto text-xs text-blue-600 hover:underline shrink-0">Our process →</a>
              </div>
            </header>

            {/* Affiliate disclosure */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
              <strong>Disclosure:</strong> This article contains affiliate links. We may earn a commission if you purchase through them, at no extra cost to you. Our editorial ratings are never influenced by commissions.{' '}
              <a href="/affiliate-disclosure" className="underline">Learn more</a>
            </div>

            {/* Table of Contents */}
            <TableOfContents items={toc} />

            {/* Article body */}
            <div className="prose max-w-none">
              <MDXRemote
                source={post.content}
                components={{ table: Table, thead: Thead, th: Th, td: Td, tr: Tr }}
              />
            </div>

            {/* Tags */}
            <div className="mt-10 pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-600 mb-3">Tagged:</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-slate-100 text-slate-600 text-sm px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>

            {/* Share */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-600 mb-3">Share this review:</p>
              <div className="flex gap-2 flex-wrap">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noopener"
                  className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium">
                  𝕏 Share on X
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noopener"
                  className="flex items-center gap-2 bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium">
                  in LinkedIn
                </a>
                <a href={`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(postUrl)}&t=${encodeURIComponent(post.title)}`}
                  target="_blank" rel="noopener"
                  className="flex items-center gap-2 bg-orange-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                  HN
                </a>
              </div>
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside>
            <div className="sticky top-24 space-y-5">

              {/* Category-matched Top Pick CTA */}
              {catMeta?.topTool && (
                <div className="bg-gradient-to-br from-blue-600 to-violet-700 text-white rounded-2xl p-5 shadow-lg">
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-wide mb-1">🏆 Our Top Pick</p>
                  <p className="font-bold text-xl mb-1" style={{fontFamily:'Sora,sans-serif'}}>{catMeta.topTool.name}</p>
                  <p className="text-blue-100 text-sm mb-4">{catMeta.topTool.desc}</p>
                  <a href={catMeta.topTool.url} rel="nofollow sponsored" target="_blank"
                    className="block w-full bg-white text-blue-700 text-center py-3 px-4 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                    {catMeta.topTool.cta}
                  </a>
                  <p className="text-blue-300 text-xs text-center mt-2">{catMeta.topTool.note}</p>
                </div>
              )}

              {/* Related posts */}
              {related.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <p className="font-bold text-slate-900 mb-4" style={{fontFamily:'Sora,sans-serif'}}>Related Reviews</p>
                  <div className="space-y-3">
                    {related.map((rel) => (
                      <a key={rel.slug} href={`/blog/${rel.slug}`}
                        className="block text-sm text-slate-700 hover:text-blue-600 font-medium transition-colors line-clamp-2 py-1.5 border-b border-slate-50 last:border-0">
                        {rel.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="bg-slate-900 text-white rounded-2xl p-5">
                <p className="font-bold text-lg mb-1" style={{fontFamily:'Sora,sans-serif'}}>📧 Weekly AI Picks</p>
                <p className="text-slate-300 text-sm mb-4">New reviews and deals every Thursday.</p>
                <NewsletterForm />
              </div>

              {/* Tools directory CTA */}
              <a href="/tools"
                className="block bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center hover:bg-amber-100 transition-colors">
                <p className="text-2xl mb-2">🗂️</p>
                <p className="font-bold text-slate-900 text-sm" style={{fontFamily:'Sora,sans-serif'}}>Browse All AI Tools</p>
                <p className="text-slate-500 text-xs mt-1">Compare tools side by side</p>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
