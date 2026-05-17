'use client';
import { useState, useMemo } from 'react';

export interface Tool {
  name: string;
  category: string;
  url: string;
  price: string | null;
  priceNum: number | null;
  rating: number;
  desc: string;
  badge: string | null;
  free: boolean;
  pros: string[];
  affiliate: boolean;
  commission?: string | null;
  /** ISO date string — set by enrich_agent when it last reviewed this tool */
  lastReviewed?: string | null;
  /** Short note added by enrich_agent explaining what changed */
  changeNote?: string | null;
}

const CATEGORIES = [
  { key: 'all',          label: 'All Tools' },
  { key: 'writing',      label: '✍️ Writing' },
  { key: 'coding',       label: '💻 Coding' },
  { key: 'design',       label: '🎨 Design' },
  { key: 'video',        label: '🎬 Video' },
  { key: 'seo',          label: '📈 SEO & Marketing' },
  { key: 'productivity', label: '⚡ Productivity' },
  { key: 'chatbots',     label: '💬 Chatbots' },
];

const BADGE_CLASS: Record<string, string> = {
  'Top Pick':            'badge-top',
  'Best Value':          'badge-free',
  "Editor's Choice":     'badge-editor',
  'Budget Pick':         'badge-new',
  'Best for Beginners':  'badge-free',
  'Best Quality':        'badge-top',
  'Best Free':           'badge-free',
};

interface Props { tools: Tool[] }

export default function ToolsClient({ tools }: Props) {
  const [cat, setCat]           = useState('all');
  const [sort, setSort]         = useState<'rating' | 'price'>('rating');
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = tools.filter((t) => cat === 'all' || t.category === cat);
    if (freeOnly) list = list.filter((t) => t.free);
    return [...list].sort((a, b) =>
      sort === 'rating' ? b.rating - a.rating : (a.priceNum ?? 0) - (b.priceNum ?? 0)
    );
  }, [cat, sort, freeOnly, tools]);

  const totalCount = tools.length;

  // Last time any tool was reviewed by the agent
  const lastRefresh = tools
    .map((t) => t.lastReviewed)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>
          AI Tools Directory
        </h1>
        <p className="text-slate-500">
          Browse and compare {totalCount} AI tools across {CATEGORIES.length - 1} categories.
          {lastRefresh && (
            <span className="ml-2 text-xs text-emerald-600 font-medium">
              ✓ Prices & ratings reviewed {new Date(lastRefresh).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-center">
          <p className="text-2xl font-bold text-blue-700" style={{ fontFamily: 'Sora,sans-serif' }}>{totalCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Tools reviewed</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-center">
          <p className="text-2xl font-bold text-emerald-700" style={{ fontFamily: 'Sora,sans-serif' }}>{CATEGORIES.length - 1}</p>
          <p className="text-xs text-slate-500 mt-0.5">Categories</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                cat === c.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'rating' | 'price')}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="rating">Sort: Top Rated</option>
            <option value="price">Sort: Lowest Price</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded accent-blue-600"
            />
            Free trial only
          </label>
          <span className="text-xs text-slate-400 ml-auto">
            {filtered.length} / {totalCount} tools
          </span>
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
            <div
              key={tool.name}
              className="bg-white border border-slate-200 rounded-2xl p-5 card-hover shadow-sm flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    {tool.category === 'seo' ? 'SEO & Marketing' : tool.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg mt-0.5 truncate" style={{ fontFamily: 'Sora,sans-serif' }}>
                    {tool.name}
                  </h3>
                </div>
                {tool.badge && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ml-2 shrink-0 ${BADGE_CLASS[tool.badge] ?? 'badge-top'}`}>
                    {tool.badge}
                  </span>
                )}
              </div>

              <p className="text-slate-500 text-sm mb-3 flex-1">{tool.desc}</p>

              {/* Change note from last enrichment */}
              {tool.changeNote && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 mb-3">
                  🔄 {tool.changeNote}
                </p>
              )}

              {/* Pros */}
              <ul className="flex flex-wrap gap-1.5 mb-4">
                {tool.pros.map((p) => (
                  <li key={p} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {p}
                  </li>
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

              <a
                href={tool.url}
                rel={tool.affiliate ? 'nofollow sponsored' : 'nofollow'}
                target="_blank"
                className={`block w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${
                  tool.affiliate
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Visit {tool.name} →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Disclosure */}
      <p className="mt-10 text-xs text-slate-400 text-center max-w-2xl mx-auto">
        Tools marked <strong>Affiliate</strong> may earn this site a commission at no extra cost to you.
        Non-affiliate tools are included purely on editorial merit.
      </p>

      {/* Comparison CTA */}
      <div className="mt-10 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-10 text-center">
        <div className="text-3xl mb-3">🔍</div>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Sora,sans-serif' }}>
          Need a head-to-head comparison?
        </h2>
        <p className="text-slate-300 mb-6">Read our in-depth comparison reviews with real benchmark data.</p>
        <a
          href="/blog"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          Browse Comparison Reviews →
        </a>
      </div>
    </div>
  );
}
