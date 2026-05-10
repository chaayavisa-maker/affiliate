'use client';
import { useState, useMemo, useEffect } from 'react';
import postsData from './posts-data.json';

interface PostMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  date: string;
}

const CAT_ICON: Record<string, string> = {
  writing: '✍️', coding: '💻', design: '🎨',
  chatbots: '💬', video: '🎬', productivity: '⚡',
};
const CAT_COLOR: Record<string, string> = {
  writing: 'from-violet-100 to-purple-100',
  coding: 'from-blue-100 to-cyan-100',
  design: 'from-pink-100 to-rose-100',
  chatbots: 'from-green-100 to-emerald-100',
  video: 'from-orange-100 to-amber-100',
  productivity: 'from-yellow-100 to-lime-100',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const q = new URLSearchParams(window.location.search).get('q') || '';
    setQuery(q);
  }, []);

  const results: PostMeta[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return postsData as PostMeta[];
    return (postsData as PostMeta[]).filter(
      (p) => p.title.toLowerCase().includes(q) ||
             p.description.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{fontFamily:'Sora,sans-serif'}}>Search Reviews</h1>
      <p className="text-slate-500 mb-8">Find AI tool reviews by name, category, or use case.</p>

      <div className="relative mb-8">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="search"
          placeholder="e.g. AI writing tools, ChatGPT, coding assistant…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base shadow-sm bg-white"
        />
      </div>

      {!mounted ? (
        <div className="text-center py-10 text-slate-400">Loading…</div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🤷</div>
          <p className="font-semibold text-slate-700">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-slate-400 text-sm mt-1">Try a different keyword or browse by category below.</p>
          <a href="/blog" className="inline-block mt-4 text-blue-600 hover:underline text-sm font-medium">Browse all reviews →</a>
        </div>
      ) : (
        <>
          <p className="text-slate-500 text-sm mb-4">
            {query
              ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
              : `All ${results.length} reviews`}
          </p>
          <div className="space-y-3">
            {results.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`}
                className="flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm hover:border-blue-200 transition-all group">
                <div className={`bg-gradient-to-br ${CAT_COLOR[post.category] ?? 'from-slate-100 to-gray-100'} text-xl shrink-0 w-12 h-12 flex items-center justify-center rounded-xl`}>
                  {CAT_ICON[post.category] ?? '🤖'}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm leading-snug" style={{fontFamily:'Sora,sans-serif'}}>
                    {post.title}
                  </h2>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{post.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-full">{post.category}</span>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
                <span className="text-blue-400 group-hover:text-blue-600 shrink-0 self-center">→</span>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
