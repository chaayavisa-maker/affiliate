import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Tools Directory',
  description: 'Browse 100+ AI tools organized by category. Find the best AI software for your needs.',
};

const TOOLS = [
  // Writing
  { name: 'Jasper AI', category: 'writing', url: 'https://jasper.ai?fpr=YOUR_ID', price: '$49/mo', rating: 4.8, desc: 'Best for marketing teams and agencies', badge: 'Top Pick', free: false },
  { name: 'Copy.ai', category: 'writing', url: 'https://copy.ai?via=YOUR_ID', price: '$49/mo', rating: 4.6, desc: 'Great for social media and ads', badge: 'Best Value', free: true },
  { name: 'Writesonic', category: 'writing', url: 'https://writesonic.com', price: '$19/mo', rating: 4.5, desc: 'Affordable with SEO features', badge: null, free: true },
  // Coding
  { name: 'GitHub Copilot', category: 'coding', url: 'https://github.com/features/copilot', price: '$10/mo', rating: 4.8, desc: 'Best IDE integration, powered by GPT-4', badge: 'Top Pick', free: false },
  { name: 'Cursor', category: 'coding', url: 'https://cursor.sh', price: '$20/mo', rating: 4.7, desc: 'AI-native code editor', badge: 'Editor's Choice', free: true },
  { name: 'Tabnine', category: 'coding', url: 'https://tabnine.com?ref=YOUR_ID', price: '$12/mo', rating: 4.4, desc: 'Privacy-focused, runs locally', badge: null, free: true },
  // Design
  { name: 'Adobe Firefly', category: 'design', url: 'https://adobe.com/products/firefly', price: '$4.99/mo', rating: 4.7, desc: 'Commercially safe AI images', badge: 'Top Pick', free: true },
  { name: 'Canva AI', category: 'design', url: 'https://canva.com/affiliates/YOUR_ID', price: '$15/mo', rating: 4.6, desc: 'Design + AI in one platform', badge: 'Best for Beginners', free: true },
  // Productivity
  { name: 'Notion AI', category: 'productivity', url: 'https://notion.so?r=YOUR_ID', price: '+$10/mo', rating: 4.6, desc: 'AI built into your workspace', badge: null, free: false },
  { name: 'Grammarly', category: 'productivity', url: 'https://grammarly.com', price: '$12/mo', rating: 4.7, desc: 'Best grammar and style checker', badge: 'Top Pick', free: true },
  { name: 'Otter.ai', category: 'productivity', url: 'https://otter.ai', price: '$17/mo', rating: 4.5, desc: 'Meeting transcription and summaries', badge: null, free: true },
  // Chatbots
  { name: 'ChatGPT Plus', category: 'chatbots', url: 'https://chat.openai.com', price: '$20/mo', rating: 4.8, desc: 'Most capable, huge plugin library', badge: 'Top Pick', free: true },
  { name: 'Claude Pro', category: 'chatbots', url: 'https://claude.ai', price: '$20/mo', rating: 4.7, desc: 'Best for long documents and coding', badge: null, free: true },
  { name: 'Perplexity Pro', category: 'chatbots', url: 'https://perplexity.ai', price: '$20/mo', rating: 4.6, desc: 'AI search with cited sources', badge: null, free: true },
];

export default function ToolsPage() {
  const categories = ['writing', 'coding', 'design', 'productivity', 'chatbots'];
  const catLabels: Record<string, string> = {
    writing: '✍️ AI Writing', coding: '💻 AI Coding',
    design: '🎨 AI Design', productivity: '⚡ Productivity', chatbots: '💬 AI Chatbots',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Tools Directory</h1>
        <p className="text-gray-500">Browse and compare the best AI software, organized by use case.</p>
      </div>

      {categories.map((cat) => {
        const catTools = TOOLS.filter((t) => t.category === cat);
        if (!catTools.length) return null;
        return (
          <section key={cat} className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{catLabels[cat]}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catTools.map((tool) => (
                <div key={tool.name} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{tool.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{tool.desc}</p>
                    </div>
                    {tool.badge && (
                      <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                        {tool.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-semibold text-gray-700">{tool.price}</span>
                    {tool.free && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Free trial</span>
                    )}
                    <span className="text-sm text-amber-500">{'★'.repeat(Math.round(tool.rating))} {tool.rating}</span>
                  </div>
                  <a href={tool.url} rel="nofollow sponsored" target="_blank"
                    className="block w-full text-center bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded-xl text-sm font-medium transition-colors">
                    Visit {tool.name} →
                  </a>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
