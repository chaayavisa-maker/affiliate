import { getAllPosts } from '@/lib/posts';
import { format } from 'date-fns';
import NewsletterForm from '@/components/NewsletterForm';

export default function HomePage() {
  const posts = getAllPosts();
  const featured = posts.slice(0, 3);
  const recent = posts.slice(3, 9);

  const categories = [
    { name: 'AI Writing Tools', slug: 'writing', icon: '✍️', desc: 'Copywriting, blog posts, essays' },
    { name: 'AI Coding Assistants', slug: 'coding', icon: '💻', desc: 'Autocomplete, code review, debugging' },
    { name: 'AI Image Generators', slug: 'design', icon: '🎨', desc: 'Art, photos, design assets' },
    { name: 'AI Chatbots', slug: 'chatbots', icon: '💬', desc: 'GPT alternatives, assistants' },
    { name: 'AI Video Tools', slug: 'video', icon: '🎬', desc: 'Video creation and editing' },
    { name: 'AI Productivity', slug: 'productivity', icon: '⚡', desc: 'Automation, summaries, notes' },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sky-300 font-medium mb-4 tracking-wide text-sm uppercase">Independent AI tool reviews</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find the Best AI Tools<br />
            <span className="text-sky-300">Without the Hype</span>
          </h1>
          <p className="text-lg text-sky-100 mb-8 max-w-2xl mx-auto">
            We test hundreds of AI tools so you don't have to. Honest reviews, real comparisons, no paid placements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/blog" className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
              Browse Reviews
            </a>
            <a href="/tools" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-semibold border border-white/20 transition-colors">
              Tool Directory
            </a>
          </div>
          <p className="text-sky-300 text-sm mt-6">{posts.length}+ reviews published · Updated daily</p>
        </div>
      </section>

      {/* AdSense Banner */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="bg-gray-100 rounded-xl h-24 flex items-center justify-center text-gray-400 text-sm">
          {/* Replace with real AdSense unit */}
          <ins className="adsbygoogle" style={{display:'block'}} data-ad-client="ca-pub-YOUR_ID" data-ad-slot="YOUR_SLOT" data-ad-format="auto" />
        </div>
      </div>

      {/* Featured Posts */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Reviews</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featured.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`} className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-sky-100 to-indigo-100 h-40 flex items-center justify-center text-5xl">
                  {categoryIcon(post.category)}
                </div>
                <div className="p-5">
                  <span className="inline-block bg-sky-100 text-sky-700 text-xs font-semibold px-2 py-1 rounded-full mb-2 capitalize">
                    {post.category}
                  </span>
                  <h3 className="font-semibold text-gray-900 group-hover:text-sky-600 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-3">{post.description}</p>
                  <div className="flex items-center text-xs text-gray-400 gap-3">
                    <span>{format(new Date(post.date), 'MMM d, yyyy')}</span>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <a key={cat.slug} href={`/blog?category=${cat.slug}`}
                className="bg-gray-50 hover:bg-sky-50 border border-gray-200 hover:border-sky-300 rounded-xl p-4 text-center transition-all group">
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="font-semibold text-sm text-gray-800 group-hover:text-sky-700">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-1">{cat.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      {recent.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Latest Reviews</h2>
            <a href="/blog" className="text-sky-600 hover:text-sky-800 text-sm font-medium">View all →</a>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {recent.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`}
                className="flex gap-4 bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm hover:border-sky-200 transition-all group">
                <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-lg w-16 h-16 flex-shrink-0 flex items-center justify-center text-2xl">
                  {categoryIcon(post.category)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-sky-600 transition-colors text-sm line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-1">{post.description}</p>
                  <div className="flex items-center text-xs text-gray-400 gap-2 mt-2">
                    <span className="capitalize">{post.category}</span>
                    <span>·</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="bg-sky-900 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Get the Best AI Tools Every Week</h2>
          <p className="text-sky-200 mb-6">"Be the first to get weekly picks, honest reviews, and money-saving deals.</p>
          <NewsletterForm />
          <p className="text-sky-400 text-sm mt-3">No spam. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* Empty state */}
      {posts.length === 0 && (
        <section className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content is being generated!</h2>
          <p className="text-gray-500">The AI agents are writing the first articles. Check back in a few minutes.</p>
        </section>
      )}
    </>
  );
}

function categoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    writing: '✍️', coding: '💻', design: '🎨',
    chatbots: '💬', video: '🎬', productivity: '⚡',
  };
  return icons[cat] || '🤖';
}
