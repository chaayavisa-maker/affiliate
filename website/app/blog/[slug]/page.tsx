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

/* ── Category metadata ─────────────────────────────────────────────────────── */
const CAT: Record<string, {
  icon: string; label: string;
  /** Tailwind gradient for the hero banner — now rich / vibrant */
  gradient: string;
  /** Pill badge colors */
  pill: string;
  topTool: { name: string; desc: string; url: string; cta: string; note: string }
}> = {
  writing: {
    icon: '✍️', label: 'AI Writing',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    pill: 'bg-violet-50 text-violet-700 border border-violet-200',
    topTool: { name: 'Jasper AI', desc: 'Best overall AI writing tool for teams and agencies.', url: 'https://www.jasper.ai', cta: 'Try Jasper Free 7 Days →', note: '7-day free trial · No credit card required' },
  },
  coding: {
    icon: '💻', label: 'AI Coding',
    gradient: 'from-blue-600 via-cyan-600 to-sky-700',
    pill: 'bg-blue-50 text-blue-700 border border-blue-200',
    topTool: { name: 'GitHub Copilot', desc: 'Top-rated AI coding assistant trusted by millions.', url: 'https://github.com/features/copilot', cta: 'Start Free Trial →', note: '30-day free trial available' },
  },
  design: {
    icon: '🎨', label: 'AI Design',
    gradient: 'from-pink-600 via-rose-500 to-orange-600',
    pill: 'bg-pink-50 text-pink-700 border border-pink-200',
    topTool: { name: 'Adobe Firefly', desc: 'Commercially safe AI image generation.', url: 'https://adobe.com/products/firefly', cta: 'Try Firefly Free →', note: 'Included with Creative Cloud plans' },
  },
  chatbots: {
    icon: '💬', label: 'AI Chatbots',
    gradient: 'from-emerald-600 via-green-600 to-teal-700',
    pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    topTool: { name: 'ChatGPT Plus', desc: 'Most capable AI assistant — GPT-4o, plugins, and more.', url: 'https://chat.openai.com', cta: 'Get ChatGPT Plus →', note: '$20/month · Cancel anytime' },
  },
  video: {
    icon: '🎬', label: 'AI Video',
    gradient: 'from-orange-600 via-amber-500 to-yellow-600',
    pill: 'bg-orange-50 text-orange-700 border border-orange-200',
    topTool: { name: 'Runway ML', desc: 'Most capable AI video generation platform.', url: 'https://runwayml.com', cta: 'Try Runway Free →', note: 'Free tier available' },
  },
  productivity: {
    icon: '⚡', label: 'AI Productivity',
    gradient: 'from-yellow-500 via-lime-500 to-green-600',
    pill: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    topTool: { name: 'Notion AI', desc: 'AI built directly into your notes, docs, and wikis.', url: 'https://notion.so', cta: 'Try Notion AI →', note: 'Add-on: $10/month per user' },
  },
};

/* ── Static params & metadata ─────────────────────────────────────────────── */
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

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function PostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const related  = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);
  const catMeta  = CAT[post.category];
  const toc      = extractToc(post.content);

  const publishedFmt = format(new Date(post.date), 'MMMM d, yyyy');
  const updatedFmt   = format(new Date(post.updatedDate), 'MMMM d, yyyy');
  const showUpdated  = post.updatedDate !== post.date;
  const postUrl      = sitePostUrl(post.slug);

  return (
    <>
      <ReadingProgress />

      {post.schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: post.schemaJson }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1fr_300px] gap-12">

          {/* ── Article ────────────────────────────────────────────────────── */}
          <article>

            {/* Breadcrumb */}
            <nav className="text-sm text-slate-400 mb-6 flex items-center gap-1.5 flex-wrap">
              <a href="/" className="hover:text-slate-600 transition-colors">Home</a>
              <span className="text-slate-300">/</span>
              <a href="/blog" className="hover:text-slate-600 transition-colors">Reviews</a>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600 capitalize">{catMeta?.label ?? post.category}</span>
            </nav>

            {/* ── Hero Banner — rich gradient with texture + floating emoji ── */}
            <div
              className={`relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br ${
                catMeta?.gradient ?? 'from-slate-600 to-gray-700'
              }`}
              style={{ height: '220px' }}
            >
              {/* Subtle dot-grid texture */}
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />
              {/* Glow blobs */}
              <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full bg-black/15 blur-2xl" />

              {/* Emoji + label */}
              <div className="relative h-full flex flex-col items-center justify-center gap-3">
                <span className="text-[80px] drop-shadow-2xl select-none" role="img" aria-label={catMeta?.label}>
                  {catMeta?.icon ?? '🤖'}
                </span>
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
                  {catMeta?.label ?? post.category}
                </span>
              </div>
            </div>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${catMeta?.pill ?? 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                  {catMeta?.icon} {catMeta?.label ?? post.category}
                </span>
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>

              <h1
                className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                {post.title}
              </h1>
              <p className="text-[17px] text-slate-500 leading-relaxed mb-5">{post.description}</p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400 pb-6 border-b border-slate-100">
                <span>Published {publishedFmt}</span>
                {showUpdated && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs border border-emerald-200">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Updated {updatedFmt}
                  </span>
                )}
                <span className="text-slate-300">·</span>
                <span className="font-medium">{post.readingTime}</span>
              </div>

              {/* Author byline */}
              <div className="flex items-center gap-3 mt-5 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                  AI
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{AUTHOR_NAME}</p>
                  <p className="text-xs text-slate-400">Hands-on testing · Updated when tools change</p>
                </div>
                <a href="/about" className="ml-auto text-xs text-blue-600 hover:underline shrink-0 font-medium">
                  Our process →
                </a>
              </div>
            </header>

            {/* ── Affiliate disclosure ─────────────────────────────────────── */}
            <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
              <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠️</span>
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Disclosure:</strong> This article contains affiliate links. We may earn a commission if you purchase through them, at no extra cost to you. Our editorial ratings are never influenced by commissions.{' '}
                <a href="/affiliate-disclosure" className="underline font-medium">Learn more</a>
              </p>
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

            {/* ── Tags ─────────────────────────────────────────────────────── */}
            <div className="mt-10 pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide text-xs">Tagged</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="bg-slate-100 text-slate-600 text-sm px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors cursor-default">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Share ─────────────────────────────────────────────────────── */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide text-xs">Share this review</p>
              <div className="flex gap-2 flex-wrap">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors font-semibold shadow-sm"
                >
                  𝕏 Share on X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-700 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors font-semibold shadow-sm"
                >
                  in Share on LinkedIn
                </a>
              </div>
            </div>
          </article>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <aside>
            <div className="sticky top-24 space-y-5">

              {/* Top Pick CTA */}
              {catMeta?.topTool && (
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl">
                  {/* background glow */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500 rounded-full blur-3xl" />
                  </div>
                  <div className="relative">
                    <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      Our Top Pick
                    </p>
                    <p className="font-bold text-xl mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {catMeta.topTool.name}
                    </p>
                    <p className="text-blue-200 text-sm mb-4 leading-relaxed">{catMeta.topTool.desc}</p>
                    <a
                      href={catMeta.topTool.url}
                      rel="nofollow sponsored"
                      target="_blank"
                      className="block w-full bg-white text-blue-700 text-center py-3 px-4 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
                    >
                      {catMeta.topTool.cta}
                    </a>
                    <p className="text-blue-400 text-[11px] text-center mt-2">{catMeta.topTool.note}</p>
                  </div>
                </div>
              )}

              {/* Related posts */}
              {related.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide text-slate-500">
                    Related Reviews
                  </p>
                  <div className="space-y-0">
                    {related.map((rel) => (
                      <a
                        key={rel.slug}
                        href={`/blog/${rel.slug}`}
                        className="flex items-start gap-2 py-3 border-b border-slate-100 last:border-0 group"
                      >
                        <span className="text-blue-500 mt-0.5 shrink-0 text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                        <span className="text-sm text-slate-700 group-hover:text-blue-600 font-medium transition-colors line-clamp-2 leading-snug">
                          {rel.title}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
                <p className="font-bold text-lg mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>📧 Weekly AI Picks</p>
                <p className="text-slate-400 text-sm mb-4">New reviews and deals every Thursday.</p>
                <NewsletterForm />
              </div>

              {/* Tools directory */}
              <a
                href="/tools"
                className="group flex items-center gap-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-md transition-all"
              >
                <span className="text-3xl">🗂️</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Browse All AI Tools
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">Compare tools side by side →</p>
                </div>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}