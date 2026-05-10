'use client';
import { useState } from 'react';

export default function NewsletterForm({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setState('loading');
    // Simulate API call — replace with your ESP (Mailchimp, ConvertKit, etc.)
    await new Promise((r) => setTimeout(r, 900));
    setState('success');
  };

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="text-3xl">🎉</div>
        <p className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>You're in!</p>
        <p className={`text-sm ${dark ? 'text-blue-200' : 'text-slate-500'}`}>
          Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-4 py-3 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-slate-200"
      />
      <button
        type="submit"
        disabled={state === 'loading'}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold transition-colors whitespace-nowrap text-sm"
      >
        {state === 'loading' ? '...' : 'Subscribe'}
      </button>
    </form>
  );
}
