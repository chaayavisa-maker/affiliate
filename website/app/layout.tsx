import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://ai-tools-hub.com'),
  title: {
    default: 'AI Tools Hub — Expert Reviews & Comparisons',
    template: '%s | AI Tools Hub',
  },
  description:
    'Unbiased AI tool reviews, comparisons, and guides. Find the best AI software for writing, coding, design, and productivity.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Tools Hub',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@AIToolsHub',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense — replace with your publisher ID */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
          crossOrigin="anonymous"
        />
        {/* Google Analytics — replace with your GA4 ID */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_GA_ID" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-YOUR_GA_ID');`,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-sky-600">
              <span className="text-2xl">🤖</span>
              AI Tools Hub
            </a>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="/blog" className="hover:text-sky-600 transition-colors">Reviews</a>
              <a href="/tools" className="hover:text-sky-600 transition-colors">Tools Directory</a>
              <a href="/blog?category=writing" className="hover:text-sky-600 transition-colors">Writing</a>
              <a href="/blog?category=coding" className="hover:text-sky-600 transition-colors">Coding</a>
              <a href="/blog?category=design" className="hover:text-sky-600 transition-colors">Design</a>
            </div>
            <a
              href="/newsletter"
              className="hidden md:inline-flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors"
            >
              Get weekly picks
            </a>
          </nav>
        </header>

        <main className="min-h-screen">{children}</main>

        <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <p className="text-white font-semibold mb-3">🤖 AI Tools Hub</p>
                <p className="text-sm">Independent reviews of AI software since 2024.</p>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Categories</p>
                <ul className="text-sm space-y-1">
                  {['Writing', 'Coding', 'Design', 'Productivity', 'Chatbots'].map((c) => (
                    <li key={c}><a href={`/blog?category=${c.toLowerCase()}`} className="hover:text-white transition-colors">{c}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Resources</p>
                <ul className="text-sm space-y-1">
                  <li><a href="/tools" className="hover:text-white transition-colors">Tools Directory</a></li>
                  <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3">Legal</p>
                <ul className="text-sm space-y-1">
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/affiliate-disclosure" className="hover:text-white transition-colors">Affiliate Disclosure</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 text-xs text-center">
              <p>© {new Date().getFullYear()} AI Tools Hub. This site contains affiliate links — we earn a commission at no cost to you.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
