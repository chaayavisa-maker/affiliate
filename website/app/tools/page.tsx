'use client';
import { useState, useMemo } from 'react';

interface Tool {
  name: string;
  category: string;
  url: string;
  price: string;
  priceNum: number;
  rating: number;
  desc: string;
  badge: string | null;
  free: boolean;
  pros: string[];
}

const TOOLS: Tool[] = [
  // Writing
  { name: 'Jasper AI',     category: 'writing',     url: 'https://jasper.ai',     price: '$49/mo', priceNum: 49, rating: 4.8, desc: 'Best for marketing teams and agencies. Powerful brand voice, 50+ templates.', badge: 'Top Pick', free: false, pros: ['Brand voice', '50+ templates', 'SEO mode'] },
  { name: 'Copy.ai',       category: 'writing',     url: 'https://copy.ai',       price: '$49/mo', priceNum: 49, rating: 4.6, desc: 'Great for social media, ads, and email copy. Generous free plan.', badge: 'Best Value', free: true, pros: ['Unlimited words', '90+ workflows', 'Free plan'] },
  { name: 'Writesonic',    category: 'writing',     url: 'https://writesonic.com', price: '$19/mo', priceNum: 19, rating: 4.5, desc: 'Affordable with built-in SEO and Surfer integration.', badge: null, free: true, pros: ['SEO tools', 'Affordable', 'GPT-4'] },
  { name: 'Rytr',          category: 'writing',     url: 'https://rytr.me',        price: '$9/mo',  priceNum: 9,  rating: 4.3, desc: 'Budget-friendly AI writer for short-form content and freelancers.', badge: 'Budget Pick', free: true, pros: ['Very affordable', '40+ templates', 'Free plan'] },
  // Coding
  { name: 'GitHub Copilot', category: 'coding',    url: 'https://github.com/features/copilot', price: '$10/mo', priceNum: 10, rating: 4.8, desc: 'Best IDE integration. Inline suggestions powered by GPT-4 Turbo.', badge: 'Top Pick', free: false, pros: ['IDE integration', 'GPT-4 Turbo', 'Multi-language'] },
  { name: 'Cursor',         category: 'coding',    url: 'https://cursor.sh',      price: '$20/mo', priceNum: 20, rating: 4.7, desc: 'AI-native code editor built on VS Code. Excellent for full file rewrites.', badge: "Editor's Choice", free: true, pros: ['AI-native editor', 'Chat with codebase', 'Free tier'] },
  { name: 'Tabnine',        category: 'coding',    url: 'https://tabnine.com',    price: '$12/mo', priceNum: 12, rating: 4.4, desc: 'Privacy-focused, can run locally. Good for enterprise teams.', badge: null, free: true, pros: ['Runs locally', 'Private', 'Team features'] },
  // Design
  { name: 'Adobe Firefly', category: 'design',     url: 'https://adobe.com/products/firefly', price: '$4.99/mo', priceNum: 5, rating: 4.7, desc: 'Commercially safe AI images, trained on licensed content.', badge: 'Top Pick', free: true, pros: ['Commercially safe', 'Adobe ecosystem', 'Excellent quality'] },
  { name: 'Canva AI',      category: 'design',     url: 'https://canva.com',      price: '$15/mo', priceNum: 15, rating: 4.6, desc: 'Design + AI generation in one platform. Perfect for non-designers.', badge: 'Best for Beginners', free: true, pros: ['All-in-one', 'Templates', 'Easy to use'] },
  { name: 'Midjourney',    category: 'design',     url: 'https://midjourney.com', price: '$10/mo', priceNum: 10, rating: 4.8, desc: 'Best image quality available. Discord-based with unique aesthetic.', badge: 'Best Quality', free: false, pros: ['Stunning quality', 'Active community', 'Styles'] },
  // Productivity
  { name: 'Notion AI',     category: 'productivity', url: 'https://notion.so',   price: '+$10/mo', priceNum: 10, rating: 4.6, desc: 'AI built into your workspace. Summarize, draft, and edit directly in Notion.', badge: null, free: false, pros: ['In-workspace AI', 'Summaries', 'Writing help'] },
  { name: 'Grammarly',     category: 'productivity', url: 'https://grammarly.com', price: '$12/mo', priceNum: 12, rating: 4.7, desc: 'Best grammar and style checker. Works across all apps.', badge: 'Top Pick', free: true, pros: ['Everywhere', 'Grammar+style', 'Plagiarism check'] },
  { name: 'Otter.ai',      category: 'productivity', url: 'https://otter.ai',   price: '$17/mo', priceNum: 17, rating: 4.5, desc: 'Meeting transcription and AI summaries. Integrates with Zoom and Teams.', badge: null, free: true, pros: ['Auto-transcription', 'Meeting summaries', 'Free 300min'] },
  // Chatbots
  { name: 'ChatGPT Plus',  category: 'chatbots',   url: 'https://chat.openai.com', price: '$20/mo', priceNum: 20, rating: 4.8, desc: 'Most capable general-purpose AI. Huge plugin library, GPT-4o.', badge: 'Top Pick', free: true, pros: ['GPT-4o', 'Plugins', 'Code interpreter'] },
  { name: 'Claude Pro',    category: 'chatbots',   url: 'https://claude.ai',   price: '$20/mo', priceNum: 20, rating: 4.7, desc: 'Best for long documents and nuanced writing. 200K context window.', badge: null, free: true, pros: ['200K context', 'Best writing', 'Uploads'] },
  { name: 'Perplexity Pro', category: 'chatbots',  url: 'https://perplexity.ai', price: '$20/mo', priceNum: 20, rating: 4.6, desc: 'AI search with cited, real-time sources. Great for research.', badge: null, free: true, pros: ['Real-time web', 'Citations', 'Research mode'] },
];

const CATEGORIES = [
  { key: 'all', label: 'All Tools' },
  { key: 'writing', label: '✍️ Writing' },
  { key: 'coding', label: '💻 Coding' },
  { key: 'design', label: '🎨 Design' },
  { key: 'productivity', label: '⚡ Productivity' },
  { key: 'chatbots', label: '💬 Chatbots' },
];

const BADGE_CLASS: Record<string, string> = {
  'Top Pick': 'badge-top',
  'Best Value': 'badge-free',
  "Editor's Choice": 'badge-editor',
  'Budget Pick': 'badge-new',
  'Best for Beginners': 'badge-free',
  'Best Quality': 'badge-top',
};

export default function ToolsPage() {
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState<'rating' | 'price'>('rating');
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = TOOLS.filter((t) => cat === 'all' || t.category === cat);
    if (freeOnly) list = list.filter((t) => t.free);
    list = [...list].sort((a, b) => sort === 'rating' ? b.rating - a.rating : a.priceNum - b.priceNum);
    return list;
  }, [cat, sort, freeOnly]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{fontFamily:'Sora,sans-serif'}}>AI Tools Directory</h1>
        <p className="text-slate-500">Browse and compare {TOOLS.length}+ AI tools, ranked by our editorial team.</p>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col sm:flex-row gap-4">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 flex-1">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCat(c.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${cat === c.key ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {c.label}
            </button>
          ))}
        </div>
        {/* Sort + Free toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <select value={sort} onChange={(e) => setSort(e.target.value as 'rating' | 'price')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="rating">Sort: Top Rated</option>
            <option value="price">Sort: Lowest Price</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded accent-blue-600" />
            Free trial only
          </label>
        </div>
      </div>

      {/* Tools grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-medium text-slate-600">No tools match these filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tool) => (
            <div key={tool.name}
              className="bg-white border border-slate-200 rounded-2xl p-5 card-hover shadow-sm flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{tool.category}</span>
                  <h3 className="font-bold text-slate-900 text-lg mt-0.5" style={{fontFamily:'Sora,sans-serif'}}>{tool.name}</h3>
                </div>
                {tool.badge && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ml-2 ${BADGE_CLASS[tool.badge] ?? 'badge-top'}`}>
                    {tool.badge}
                  </span>
                )}
              </div>

              <p className="text-slate-500 text-sm mb-3 flex-1">{tool.desc}</p>

              {/* Pros */}
              <ul className="flex flex-wrap gap-1.5 mb-4">
                {tool.pros.map((p) => (
                  <li key={p} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{p}</li>
                ))}
              </ul>

              {/* Rating + Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-amber-400 text-sm">{'★'.repeat(Math.round(tool.rating))}</span>
                <span className="text-slate-700 font-semibold text-sm">{tool.rating}</span>
                <span className="ml-auto text-slate-700 font-semibold text-sm">{tool.price}</span>
                {tool.free && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                    Free trial
                  </span>
                )}
              </div>

              <a href={tool.url} rel="nofollow sponsored" target="_blank"
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors">
                Visit {tool.name} →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Comparison CTA */}
      <div className="mt-16 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-10 text-center">
        <div className="text-3xl mb-3">🔍</div>
        <h2 className="text-2xl font-bold mb-2" style={{fontFamily:'Sora,sans-serif'}}>Need a head-to-head comparison?</h2>
        <p className="text-slate-300 mb-6">Read our in-depth comparison reviews with real benchmark data.</p>
        <a href="/blog" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
          Browse Comparison Reviews →
        </a>
      </div>
    </div>
  );
}
