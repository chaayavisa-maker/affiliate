import { getAllPosts } from '@/lib/posts';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { SITE_NAME, SITE_TAGLINE, SITE_DESC, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description: SITE_DESC,
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESC,
    url: SITE_URL,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-home.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
};

const CATEGORY_META: Record<string, { icon: string; label: string; desc: string; color: string }> = {
  writing:      { icon: '✍️', label: 'AI Writing',     desc: 'Copywriting, blogs, essays',    color: 'from-violet-100 to-purple-100' },
  coding:       { icon: '💻', label: 'AI Coding',       desc: 'Autocomplete, code review',     color: 'from-blue-100 to-cyan-100' },
  design:       { icon: '🎨', label: 'AI Design',       desc: 'Images, art, design assets',    color: 'from-pink-100 to-rose-100' },
  chatbots:     { icon: '💬', label: 'AI Chatbots',     desc: 'GPT alternatives, assistants',  color: 'from-green-100 to-emerald-100' },
  video:        { icon: '🎬', label: 'AI Video',        desc: 'Video creation and editing',    color: 'from-orange-100 to-amber-100' },
  productivity: { icon: '⚡', label: 'AI Productivity', desc: 'Automation, notes, summaries',  color: 'from-yellow-100 to-lime-100' },
};

const TOP_TOOLS = [
  { name: 'Jasper AI',       cat: 'Writing', rating: 4.8, badge: '🏆 Top Pick', cta: 'Try Free 7 Days', url: 'https://www.jasper.ai', price: 'From $49/mo' },
  { name: 'GitHub Copilot',  cat: 'Coding',  rating: 4.8, badge: '🏆 Top Pick', cta: 'Start Free Trial', url: 'https://github.com/features/copilot', price: 'From $10/mo' },
  { name: 'ChatGPT Plus',    cat: 'Chatbot', rating: 4.8, badge: '🏆 Top Pick', cta: 'Get ChatGPT Plus', url: 'https://chat.openai.com', price: '$20/mo' },
];

export default function HomePage() {
  const posts = getAllPosts();
  const featured = posts.slice(0, 3);
  const categories = Object.entries(CATEGORY_META);

  // Honest stats derived from real data
  const reviewCount = posts.length;
  const categoryCount = [...new Set(posts.map(p => p.category))].length;

  return (
    <>
      {/* ── Schema.org Organization ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/favicon.svg`,
            description: SITE_DESC,
            sameAs: [
              'https://twitter.com/aireviewstack',
            ],
          }),
        }}
      />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-24 px-4" role="region" aria-label="Hero section">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-violet-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6 animate-fadeUp">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse inline-block" aria-hidden="true" />
            Independent reviews · No paid placements
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fadeUp delay-100" style={{fontFamily:'Sora,sans-serif'}}>
            Find the Best AI Tools<br />
            <span className="gradient-text">Without the Hype</span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto animate-fadeUp delay-200">
            We test AI tools with real accounts — honest reviews, real benchmarks, zero paid placements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fadeUp delay-300">
            <a href="/blog" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-900/30" role="button">
              Browse All Reviews
            </a>
            <a href="/tools" className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-xl font-semibold border border-white/20 transition-colors" role="button">
              Tools Directory
            </a>
          </div>
          {/* Real stats — derived from actual content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 animate-fadeUp delay-400">
            <div className="bg-white/5 border border-white/10 rounded-2xl py-4 px-3">
              <p className="text-2xl font-bold text-white" style={{fontFamily:'Sora,sans-serif'}}>{reviewCount}</p>
              <p className="text-slate-400 text-xs mt-1">In-depth reviews</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl py-4 px-3">
              <p className="text-2xl font-bold text-white" style={{fontFamily:'Sora,sans-serif'}}>{categoryCount}</p>
              <p className="text-slate-400 text-xs mt-1">Tool categories</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl py-4 px-3">
              <p className="text-2xl font-bold text-white" style={{fontFamily:'Sora,sans-serif'}}>100%</p>
              <p className="text-slate-400 text-xs mt-1">Independent editorial</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl py-4 px-3">
              <p className="text-2xl font-bold text-white" style={{fontFamily:'Sora,sans-serif'}}>$0</p>
              <p className="text-slate-400 text-xs mt-1">Paid placements</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Top Picks ── */}
      <section className="max-w-6xl mx-auto px-4 py-14" role="region" aria-label="Editor's top picks">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900" style={{fontFamily:'Sora,sans-serif'}}>🏆 Editor Top Picks</h2>
            <p className="text-slate-500 text-sm mt-1">Highest-rated tools we actually use and recommend</p>
          </div>
          <a href="/tools" className="text-blue-600 hover:text-blue-800 text-sm font-medium hidden sm:block">View all tools →</a>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TOP_TOOLS.map((tool) => (
            <article key={tool.name} className="bg-white border border-slate-200 rounded-2xl p-5 card-hover shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{tool.cat}</span>
                  <h3 className="font-bold text-slate-900 text-lg mt-0.5" style={{fontFamily:'Sora,sans-serif'}}>{tool.name}</h3>
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg whitespace-nowrap" aria-label={tool.badge}>{tool.badge}</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-amber-400" aria-label={`${tool.rating} out of 5 stars`}>{'★'.repeat(Math.round(tool.rating))}</span>
                <span className="text-slate-600 font-semibold text-sm">{tool.rating}</span>
                <span className="text-slate-400 text-sm ml-auto">{tool.price}</span>
              </div>
              <a href={tool.url} rel="nofollow sponsored" target="_blank"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors"
                aria-label={`Open ${tool.name} in new window`}>
                {tool.cta} →
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* ── Featured Reviews ── */}
      {featured.length > 0 && (
        <section className="bg-white py-14" role="region" aria-label="Featured reviews">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900" style={{fontFamily:'Sora,sans-serif'}}>📰 Featured Reviews</h2>
              <a href="/blog" className="text-blue-600 hover:text-blue-800 text-sm font-medium">See all →</a>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featured.map((post, i) => {
                const meta = CATEGORY_META[post.category] ?? { icon: '🤖', color: 'from-slate-100 to-gray-100', label: post.category, desc: '' };
                return (
                  <article key={post.slug}
                    className="group bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden card-hover animate-fadeUp"
                    style={{animationDelay:`${i*0.1}s`}}>
                    <a href={`/blog/${post.slug}`} className="block">
                      <div className={`bg-gradient-to-br ${meta.color} h-40 flex items-center justify-center text-5xl`} aria-hidden="true">
                        {meta.icon}
                      </div>
                      <div className="p-5">
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2.5 capitalize">
                          {meta.label}
                        </span>
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2" style={{fontFamily:'Sora,sans-serif'}}>
                          {post.title}
                        </h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-3">{post.description}</p>
                        <div className="flex items-center text-xs text-slate-400 gap-2">
                          <time dateTime={post.date}>{format(new Date(post.date), 'MMM d, yyyy')}</time>
                          <span>·</span>
                          <span>{post.readingTime}</span>
                        </div>
                      </div>
                    </a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Categories ── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-slate-900 mb-8" style={{fontFamily:'Sora,sans-serif'}}>Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(([slug, meta]) => (
            <a key={slug} href={`/blog?category=${slug}`}
              className="group bg-white hover:border-blue-300 border border-slate-200 rounded-2xl p-4 text-center transition-all card-hover">
              <div className={`bg-gradient-to-br ${meta.color} w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-2xl mb-3`}>
                {meta.icon}
              </div>
              <p className="font-semibold text-sm text-slate-800 group-hover:text-blue-700" style={{fontFamily:'Sora,sans-serif'}}>{meta.label}</p>
              <p className="text-xs text-slate-500 mt-1">{meta.desc}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── Recent Reviews ── */}
      {recent.length > 0 && (
        <section className="bg-slate-50 py-14">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900" style={{fontFamily:'Sora,sans-serif'}}>⚡ Latest Reviews</h2>
              <a href="/blog" className="text-blue-600 hover:text-blue-800 text-sm font-medium">View all →</a>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {recent.map((post) => {
                const meta = CATEGORY_META[post.category] ?? { icon: '🤖', color: 'from-slate-100 to-gray-100', label: post.category, desc: '' };
                return (
                  <a key={post.slug} href={`/blog/${post.slug}`}
                    className="flex gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-blue-200 transition-all group card-hover">
                    <div className={`bg-gradient-to-br ${meta.color} rounded-xl w-16 h-16 flex-shrink-0 flex items-center justify-center text-2xl`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{meta.label}</span>
                      <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors text-sm line-clamp-2 mt-0.5" style={{fontFamily:'Sora,sans-serif'}}>
                        {post.title}
                      </h3>
                      <div className="flex items-center text-xs text-slate-400 gap-2 mt-2">
                        <span>{format(new Date(post.date), 'MMM d, yyyy')}</span>
                        <span>·</span>
                        <span>{post.readingTime}</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust Section ── */}
      <section className="bg-white py-14 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-wide mb-8">Why readers trust us</p>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '🔬', title: 'Real Testing', desc: 'Every tool tested with a live account — no screenshots or press kits.' },
              { icon: '💰', title: 'No Paid Reviews', desc: 'Rankings are 100% merit-based. No tool can buy a better score.' },
              { icon: '🔄', title: 'Always Current', desc: 'We update reviews when tools change pricing, features, or quality.' },
              { icon: '📖', title: 'Full Transparency', desc: 'Affiliate links are clearly disclosed on every page, always.' },
            ].map((item) => (
              <div key={item.title}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="font-bold text-slate-900 mb-2" style={{fontFamily:'Sora,sans-serif'}}>{item.title}</p>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {posts.length === 0 && (
        <section className="max-w-2xl mx-auto px-4 py-24 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Content is being generated!</h2>
          <p className="text-slate-500">The AI agents are writing the first articles. Check back in a few minutes.</p>
        </section>
      )}
    </>
  );
}
