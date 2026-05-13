import { getAllPosts } from '@/lib/posts';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tool Reviews',
  description: 'In-depth reviews and comparisons of the best AI tools for writing, coding, design, and more.',
};

const CATEGORY_META: Record<string, {
  icon: string; label: string;
  gradient: string; accent: string; textColor: string;
}> = {
  writing:      { icon: '✍️', label: 'AI Writing',     gradient: 'from-violet-500 to-purple-600',  accent: 'bg-violet-500',  textColor: 'text-violet-700' },
  coding:       { icon: '💻', label: 'AI Coding',       gradient: 'from-blue-500 to-cyan-600',      accent: 'bg-blue-500',    textColor: 'text-blue-700' },
  design:       { icon: '🎨', label: 'AI Design',       gradient: 'from-pink-500 to-rose-600',      accent: 'bg-pink-500',    textColor: 'text-pink-700' },
  chatbots:     { icon: '💬', label: 'AI Chatbots',     gradient: 'from-emerald-500 to-green-600',  accent: 'bg-emerald-500', textColor: 'text-emerald-700' },
  video:        { icon: '🎬', label: 'AI Video',        gradient: 'from-orange-500 to-amber-600',   accent: 'bg-orange-500',  textColor: 'text-orange-700' },
  productivity: { icon: '⚡', label: 'AI Productivity', gradient: 'from-yellow-500 to-lime-600',    accent: 'bg-yellow-500',  textColor: 'text-yellow-700' },
};

const BG_PILL: Record<string, string> = {
  writing: 'bg-violet-50 text-violet-700 border-violet-200',
  coding:  'bg-blue-50 text-blue-700 border-blue-200',
  design:  'bg-pink-50 text-pink-700 border-pink-200',
  chatbots:'bg-emerald-50 text-emerald-700 border-emerald-200',
  video:   'bg-orange-50 text-orange-700 border-orange-200',
  productivity:'bg-yellow-50 text-yellow-700 border-yellow-200',
};

interface Props {
  searchParams: { category?: string; page?: string };
}

export default function BlogPage({ searchParams }: Props) {
  const allPosts = getAllPosts();
  const category = searchParams.category || '';
  const page     = parseInt(searchParams.page || '1', 10);
  const PER_PAGE = 12;

  const filtered   = category ? allPosts.filter((p) => p.category === category) : allPosts;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const posts      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const categories = [...new Set(allPosts.map((p) => p.category))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">

      {/* ── Page Header ── */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
          📝 {allPosts.length} Reviews & Comparisons
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{fontFamily:'Sora,sans-serif'}}>
          AI Tool Reviews
        </h1>
        <p className="text-slate-500 text-lg">
          Honest, hands-on reviews updated regularly. We pay for accounts ourselves.
        </p>
      </div>

      {/* ── Category Filter ── */}
      <div className="flex flex-wrap gap-2 mb-10">
        <a
          href="/blog"
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
            !category
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({allPosts.length})
        </a>
        {categories.map((cat) => {
          const count = allPosts.filter((p) => p.category === cat).length;
          const meta  = CATEGORY_META[cat];
          const active = category === cat;
          return (
            <a
              key={cat}
              href={`/blog?category=${cat}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : `${BG_PILL[cat] ?? 'bg-white text-slate-600 border-slate-200'} hover:opacity-80`
              }`}
            >
              {meta?.icon} {meta?.label ?? cat}
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-black/10'}`}>
                {count}
              </span>
            </a>
          );
        })}
      </div>

      {/* ── Posts Grid ── */}
      {posts.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {posts.map((post, i) => {
              const meta = CATEGORY_META[post.category] ?? {
                icon: '🤖', gradient: 'from-slate-500 to-gray-600',
                accent: 'bg-slate-500', textColor: 'text-slate-700', label: post.category,
              };
              const pillColor = BG_PILL[post.category] ?? 'bg-slate-50 text-slate-600 border-slate-200';
              const isFeatured = i === 0 && page === 1 && !category;

              return (
                <a
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 animate-fadeUp"
                  style={{animationDelay:`${(i % 3) * 0.08}s`}}
                >
                  {/* Card top: gradient banner */}
                  <div className={`relative bg-gradient-to-br ${meta.gradient} h-40 flex items-center justify-center overflow-hidden`}>
                    {/* Subtle noise texture overlay */}
                    <div className="absolute inset-0 opacity-20"
                      style={{backgroundImage:`url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`}}>
                    </div>
                    <span className="relative text-5xl drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
                      {meta.icon}
                    </span>
                    {isFeatured && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
                        ⭐ Featured
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-black/30 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {post.readingTime}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${pillColor}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>

                    <h2
                      className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug"
                      style={{fontFamily:'Sora,sans-serif', fontSize:'15px'}}
                    >
                      {post.title}
                    </h2>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
                      {post.description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <time className="text-[11px] text-slate-400 font-medium">
                        {format(new Date(post.date), 'MMM d, yyyy')}
                      </time>
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold group-hover:gap-2 transition-all">
                        Read review
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              {page > 1 && (
                <a
                  href={`/blog?${category ? `category=${category}&` : ''}page=${page - 1}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ← Prev
                </a>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/blog?${category ? `category=${category}&` : ''}page=${p}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                    p === page
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </a>
              ))}
              {page < totalPages && (
                <a
                  href={`/blog?${category ? `category=${category}&` : ''}page=${page + 1}`}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Next →
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-24 text-slate-400">
          <div className="text-6xl mb-5">📝</div>
          <p className="text-xl font-semibold text-slate-600 mb-1">No articles yet in this category</p>
          <p className="text-sm">Content is being generated daily — check back soon!</p>
          <a href="/blog" className="inline-flex mt-6 items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            ← View all reviews
          </a>
        </div>
      )}
    </div>
  );
}