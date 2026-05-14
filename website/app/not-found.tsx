import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'Sorry, the page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
          404
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
          Page Not Found
        </h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you were looking for. It might have been moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            ← Back to Home
          </a>
          <a
            href="/blog"
            className="inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-900 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Browse Reviews →
          </a>
        </div>
      </div>
    </div>
  );
}
