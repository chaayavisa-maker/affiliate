import { getAllPosts } from '@/lib/posts';
import { format } from 'date-fns';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tool Reviews',
  description: 'In-depth reviews and comparisons of the best AI tools for writing, coding, design, and more.',
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
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tool Reviews</h1>
        <p className="text-gray-500">Honest, in-depth reviews updated daily by our AI research team.</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <a href="/blog"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!category ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All ({allPosts.length})
        </a>
        {categories.map((cat) => {
          const count = allPosts.filter((p) => p.category === cat).length;
          return (
            <a key={cat} href={`/blog?category=${cat}`}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${category === cat ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat} ({count})
            </a>
          );
        })}
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {posts.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                <div className="bg-gradient-to-br from-sky-50 to-indigo-100 h-36 flex items-center justify-center text-4xl">
                  {catIcon(post.category)}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-sky-100 text-sky-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.readingTime}</span>
                  </div>
                  <h2 className="font-semibold text-gray-900 group-hover:text-sky-600 transition-colors line-clamp-2 mb-2 text-sm leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-3">{post.description}</p>
                  <p className="text-xs text-gray-400">{format(new Date(post.date), 'MMMM d, yyyy')}</p>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a key={p} href={`/blog?${category ? `category=${category}&` : ''}page=${p}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {p}
                </a>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-lg font-medium text-gray-600">No articles yet in this category</p>
          <p className="text-sm mt-1">Content is being generated daily — check back soon!</p>
        </div>
      )}
    </div>
  );
}

function catIcon(cat: string) {
  return ({ writing: '✍️', coding: '💻', design: '🎨', chatbots: '💬', video: '🎬', productivity: '⚡' } as Record<string,string>)[cat] || '🤖';
}
