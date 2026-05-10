'use client';

import { useState } from 'react';

const PERKS = [
  { icon: '🔍', title: 'One deep-dive review', desc: 'A thorough breakdown of one AI tool per week — pricing, real use cases, and who it is actually for.' },
  { icon: '⚡', title: '3 tools worth trying', desc: 'Quick picks from the week — new launches, updates, and hidden gems we found worth your time.' },
  { icon: '💰', title: 'Exclusive deals', desc: 'Discounts and extended trials negotiated directly with software companies for our subscribers.' },
  { icon: '📊', title: 'Market radar', desc: 'What is changing in the AI tools space — pricing shifts, shutdowns, major updates — so you are never caught off guard.' },
];

const TESTIMONIALS = [
  { quote: 'The only newsletter I actually read every week. Saves me hours of research.', name: 'Sarah K.', role: 'Freelance writer' },
  { quote: 'Found three tools through this newsletter that genuinely changed how I work.', name: 'Marcus T.', role: 'Marketing manager' },
  { quote: 'No fluff, no sponsored garbage. Just honest picks. Rare these days.', name: 'Priya M.', role: 'Product designer' },
];

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect to Beehiiv / ConvertKit / Mailchimp
    // Replace this setTimeout with your actual API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">You are on the list!</h1>
        <p className="text-gray-500 text-lg mb-8">
          Welcome to AI Tools Hub Weekly. Your first issue arrives next Sunday.
        </p>
        <a href="/blog" className="inline-block bg-sky-600 hover:bg-sky-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors">
          Browse reviews while you wait →
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sky-300 text-sm font-medium uppercase tracking-wide mb-4">Free weekly newsletter</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            The Best AI Tools,<br />Curated Every Sunday
          </h1>
          <p className="text-sky-100 text-lg mb-8">
            Join professionals getting honest AI tool picks, exclusive deals, and market insights — without the hype.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap"
            >
              {loading ? 'Subscribing...' : 'Subscribe free'}
            </button>
          </form>
          <p className="text-sky-400 text-sm mt-4">No spam. Unsubscribe anytime. Free forever.</p>
        </div>
      </section>

      {/* What you get */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">What is in every issue</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {PERKS.map((p) => (
            <div key={p.title} className="flex gap-4 bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <div className="text-2xl flex-shrink-0">{p.icon}</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 border-y border-gray-200 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">What readers say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to stay ahead of the curve?</h2>
        <p className="text-gray-500 mb-8">Takes 10 seconds to sign up. Cancel anytime.</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap"
          >
            {loading ? 'Subscribing...' : 'Subscribe free'}
          </button>
        </form>
      </section>

    </div>
  );
}
