import { getAllPosts } from '@/lib/posts';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tool Reviews',
  description: 'In-depth reviews and comparisons of the best AI tools for writing, coding, design, and more.',
};

const CATEGORY_META: Record<string, { icon: string; label: string; color: string }> = {
  writing:      { icon: '✍️', label: 'AI Writing',     color: 'from-violet-100 to-purple-100' },
  coding:       { icon: '💻', label: 'AI Coding',       color: 'from-blue-100 to-cyan-100' },
  design:       { icon: '🎨', label: 'AI Design',       color: 'from-pink-100 to-rose-100' },
  chatbots:     { icon: '💬', label: 'AI Chatbots',     color: 'from-green-100 to-emerald-100' },
  video:        { icon: '🎬', label: 'AI Video',        color: 'from-orange-100 to-amber-100' },
  productivity: { icon: '⚡', label: 'AI Productivity', color: 'from-yellow-100 to-lime-100' },
};

interface Props {
  searchParams: { category?: string; page?: string };
}

export default function BlogPage({ searchParams }: Props) {
  const allPosts = getAllPosts();
  const category = searchParams.category || '';
  const page = parseInt(searchParams.page || '1', 10);
  const PER_PAGE = 12;

  const filtered = category ? allPosts.filter((p) => p.category === category) : allPosts;
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const posts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const categories = [...new Set(allPosts.map((p) => p.category))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{fontFamily:'Sora,sans-serif'}}>AI Tool Reviews</h1>
        <p className="text-slate-500">Honest, hands-on reviews updated regularly by our research team.</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        <a href="/blog"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!category ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          All Reviews ({allPosts.length})
        </a>
        {categories.map((cat) => {
          const count = allPosts.filter((p) => p.category === cat).length;
          const meta = CATEGORY_META[cat];
          return (
            <a key={cat} href={`/blog?category=${cat}`}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${category === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {meta?.icon} {cat} ({count})
            </a>
          );
        })}
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {posts.map((post, i) => {
              const meta = CATEGORY_META[post.category] ?? { icon: '🤖', color: 'from-slate-100 to-gray-100', label: post.category };
              return (
                <a key={post.slug} href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden card-hover shadow-sm animate-fadeUp"
                  style={{animationDelay:`${(i%3)*0.1}s`}}>
                  <div className={`bg-gradient-to-br ${meta.color} h-36 flex items-center justify-center text-4xl`}>
                    {meta.icon}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-400">{post.readingTime}</span>
                    </div>
                    <h2 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 text-sm leading-snug" style={{fontFamily:'Sora,sans-serif'}}>
                      {post.title}
                    </h2>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-3">{post.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{format(new Date(post.date), 'MMM d, yyyy')}</p>
                      <span className="text-xs text-blue-600 font-medium group-hover:underline">Read review →</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a key={p} href={`/blog?${category ? `category=${category}&` : ''}page=${p}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-lg font-medium text-slate-600">No articles yet in this category</p>
          <p className="text-sm mt-1">Content is being generated daily — check back soon!</p>
        </div>
      )}
    </div>
  );
}
