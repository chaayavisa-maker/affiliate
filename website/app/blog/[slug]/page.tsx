import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Table, Thead, Th, Td, Tr } from '@/components/mdx/Table';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import ReadingProgress from '@/components/ReadingProgress';
import NewsletterForm from '@/components/NewsletterForm';

interface Props {
  params: { slug: string };
}

const CATEGORY_META: Record<string, { icon: string; label: string; color: string; topTool: { name: string; desc: string; url: string; cta: string; note: string } }> = {
  writing: {
    icon: '✍️', label: 'AI Writing', color: 'from-violet-100 to-purple-100',
    topTool: { name: 'Jasper AI', desc: 'Best overall AI writing tool for teams and agencies.', url: 'https://www.jasper.ai', cta: 'Try Jasper Free 7 Days →', note: '7-day free trial · No credit card required' },
  },
  coding: {
    icon: '💻', label: 'AI Coding', color: 'from-blue-100 to-cyan-100',
    topTool: { name: 'GitHub Copilot', desc: 'Top-rated AI coding assistant trusted by 1M+ developers.', url: 'https://github.com/features/copilot', cta: 'Start Free Trial →', note: '30-day free trial available' },
  },
  design: {
    icon: '🎨', label: 'AI Design', color: 'from-pink-100 to-rose-100',
    topTool: { name: 'Adobe Firefly', desc: 'Commercially safe AI image generation, integrated with Adobe.', url: 'https://adobe.com/products/firefly', cta: 'Try Firefly Free →', note: 'Included with Creative Cloud plans' },
  },
  chatbots: {
    icon: '💬', label: 'AI Chatbots', color: 'from-green-100 to-emerald-100',
    topTool: { name: 'ChatGPT Plus', desc: 'The most capable AI assistant — GPT-4o, plugins, and more.', url: 'https://chat.openai.com', cta: 'Get ChatGPT Plus →', note: '$20/month · Cancel anytime' },
  },
  video: {
    icon: '🎬', label: 'AI Video', color: 'from-orange-100 to-amber-100',
    topTool: { name: 'Runway ML', desc: 'Most capable AI video generation and editing platform.', url: 'https://runwayml.com', cta: 'Try Runway Free →', note: 'Free tier available' },
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
    },
  };
}

export default function PostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const related = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  const catMeta = CATEGORY_META[post.category];
  const topTool = catMeta?.topTool;

  return (
    <>
      <ReadingProgress />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[1fr_300px] gap-12">

          {/* ── Main Article ── */}
          <article>
            {/* Breadcrumb */}
            <nav className="text-sm text-slate-400 mb-6 flex items-center gap-1.5">
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
              <p className="text-lg text-slate-500 mb-4">{post.description}</p>
              <div className="flex items-center gap-4 text-sm text-slate-400 pb-6 border-b border-slate-100">
                <span>Updated {format(new Date(post.date), 'MMMM d, yyyy')}</span>
                <span>·</span>
                <span>{post.readingTime}</span>
              </div>
            </header>

            {/* Disclosure */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-sm text-amber-800">
              <strong>Affiliate disclosure:</strong> This article may contain affiliate links. We earn a commission if you purchase through our links, at no extra cost to you. Our editorial opinions are never influenced by commissions. <a href="/affiliate-disclosure" className="underline">Learn more</a>
            </div>

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
              <div className="flex gap-2">
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://affiliate-silk-six.vercel.app/blog/${post.slug}`)}`}
                  target="_blank" rel="noopener"
                  className="flex items-center gap-2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium">
                  𝕏 Share on X
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://affiliate-silk-six.vercel.app/blog/${post.slug}`)}`}
                  target="_blank" rel="noopener"
                  className="flex items-center gap-2 bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium">
                  LinkedIn
                </a>
              </div>
            </div>
          </article>

          {/* ── Sidebar ── */}
          <aside>
            <div className="sticky top-24 space-y-5">

              {/* Top Pick CTA */}
              {topTool && (
                <div className="bg-gradient-to-br from-blue-600 to-violet-700 text-white rounded-2xl p-5 shadow-lg">
                  <p className="text-xs font-bold text-blue-200 uppercase tracking-wide mb-1">🏆 Our Top Pick</p>
                  <p className="font-bold text-xl mb-1" style={{fontFamily:'Sora,sans-serif'}}>{topTool.name}</p>
                  <p className="text-blue-100 text-sm mb-4">{topTool.desc}</p>
                  <a href={topTool.url} rel="nofollow sponsored" target="_blank"
                    className="block w-full bg-white text-blue-700 text-center py-3 px-4 rounded-xl font-bold text-sm transition-all hover:bg-blue-50">
                    {topTool.cta}
                  </a>
                  <p className="text-blue-300 text-xs text-center mt-2">{topTool.note}</p>
                </div>
              )}

              {/* Related posts */}
              {related.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <p className="font-bold text-slate-900 mb-4" style={{fontFamily:'Sora,sans-serif'}}>Related Reviews</p>
                  <div className="space-y-3">
                    {related.map((rel) => (
                      <a key={rel.slug} href={`/blog/${rel.slug}`}
                        className="block text-sm text-slate-700 hover:text-blue-600 font-medium transition-colors line-clamp-2 leading-snug py-1 border-b border-slate-50 last:border-0">
                        {rel.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter sidebar */}
              <div className="bg-slate-900 text-white rounded-2xl p-5">
                <p className="font-bold text-lg mb-1" style={{fontFamily:'Sora,sans-serif'}}>📧 Weekly AI Picks</p>
                <p className="text-slate-300 text-sm mb-4">Join 50K+ readers. New tools every Thursday.</p>
                <NewsletterForm />
              </div>

              {/* Tools directory CTA */}
              <a href="/tools" className="block bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center hover:bg-amber-100 transition-colors">
                <p className="text-2xl mb-2">🗂️</p>
                <p className="font-bold text-slate-900 text-sm" style={{fontFamily:'Sora,sans-serif'}}>Browse All AI Tools</p>
                <p className="text-slate-500 text-xs mt-1">100+ tools ranked by category</p>
              </a>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
