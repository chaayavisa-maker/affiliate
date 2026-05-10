import type { Metadata } from 'next';
import './globals.css';
import MobileMenu from '@/components/MobileMenu';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://affiliate-silk-six.vercel.app'),
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

const NAV = [
  { href: '/blog', label: 'Reviews' },
  { href: '/tools', label: 'Tools Directory' },
  { href: '/blog?category=writing', label: 'Writing' },
  { href: '/blog?category=coding', label: 'Coding' },
  { href: '/blog?category=design', label: 'Design' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense — replace YOUR_PUBLISHER_ID when approved */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID" crossOrigin="anonymous" /> */}
        {/* Google Analytics — replace G-YOUR_GA_ID */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_GA_ID" /> */}
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">

        {/* Top notification bar */}
        <div className="bg-blue-600 text-white text-xs text-center py-2 px-4 font-medium">
          🔥 New: <a href="/blog" className="underline hover:no-underline font-semibold">Best AI Voice Generators for Business 2026</a> — just published
        </div>

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 shrink-0" style={{fontFamily:'Sora,sans-serif'}}>
              <span className="text-2xl">🤖</span>
              <span className="hidden sm:inline">AI Tools Hub</span>
              <span className="sm:hidden">AIHub</span>
            </a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              {NAV.map((n) => (
                <a key={n.href} href={n.href}
                  className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">
                  {n.label}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <a href="/newsletter"
                className="hidden md:inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                📧 Weekly Picks
              </a>
              {/* Mobile menu */}
              <MobileMenu />
            </div>
          </nav>
        </header>

        <main className="min-h-screen">{children}</main>

        <footer className="bg-slate-900 text-slate-400 py-14 mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div className="md:col-span-1">
                <p className="text-white font-bold text-lg mb-2" style={{fontFamily:'Sora,sans-serif'}}>🤖 AI Tools Hub</p>
                <p className="text-sm leading-relaxed">Independent, hands-on reviews of AI software. We test so you don't waste money.</p>
                <div className="flex gap-3 mt-4">
                  <a href="https://twitter.com/AIToolsHub" className="text-slate-500 hover:text-white transition-colors text-lg">𝕏</a>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Categories</p>
                <ul className="text-sm space-y-2">
                  {['Writing', 'Coding', 'Design', 'Productivity', 'Chatbots', 'Video'].map((c) => (
                    <li key={c}>
                      <a href={`/blog?category=${c.toLowerCase()}`} className="hover:text-white transition-colors">{c}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Resources</p>
                <ul className="text-sm space-y-2">
                  <li><a href="/tools" className="hover:text-white transition-colors">Tools Directory</a></li>
                  <li><a href="/blog" className="hover:text-white transition-colors">All Reviews</a></li>
                  <li><a href="/newsletter" className="hover:text-white transition-colors">Newsletter</a></li>
                  <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Legal</p>
                <ul className="text-sm space-y-2">
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/affiliate-disclosure" className="hover:text-white transition-colors">Affiliate Disclosure</a></li>
                </ul>
                <div className="mt-4 p-3 bg-slate-800 rounded-xl text-xs leading-relaxed">
                  ⚠️ This site contains affiliate links. We earn commissions at no cost to you.
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
              <p>© {new Date().getFullYear()} AI Tools Hub. All rights reserved.</p>
              <p>Tested & reviewed by our editorial team.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
