'use client';

import type { ReactNode } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: Props) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
          Something went wrong
        </h1>
        <p className="text-slate-500 mb-2 leading-relaxed">
          We encountered an unexpected error. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-left">
            <code className="text-xs text-red-700 break-words">{error.message}</code>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
