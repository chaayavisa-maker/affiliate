import type { Metadata } from 'next';
import './globals.css';
import MobileMenu from '@/components/MobileMenu';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_DESC,
  TWITTER_HANDLE,
  TWITTER_URL,
} from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    site: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

const CATEGORIES = [
  { href: '/blog?category=writing',      label: '✍️ Writing' },
  { href: '/blog?category=coding',       label: '💻 Coding' },
  { href: '/blog?category=design',       label: '🎨 Design' },
  { href: '/blog?category=productivity', label: '⚡ Productivity' },
  { href: '/blog?category=chatbots',     label: '💬 Chatbots' },
  { href: '/blog?category=video',        label: '🎬 Video' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense — uncomment and replace YOUR_PUBLISHER_ID when approved */}
        {/* <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID" crossOrigin="anonymous" /> */}
        {/* Google Analytics — uncomment and replace G-YOUR_GA_ID */}
        {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_GA_ID" /> */}
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">

        {/* Top bar */}
        <div className="bg-blue-600 text-white text-xs text-center py-2 px-4 font-medium">
          🔥 Latest: <a href="/blog" className="underline hover:no-underline font-semibold">Best AI Voice Generators for Business 2026</a>
        </div>

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 shrink-0" style={{fontFamily:'Sora,sans-serif'}}>
              <span className="text-2xl">🤖</span>
              <span className="hidden sm:inline">{SITE_NAME}</span>
              <span className="sm:hidden">AIHub</span>
            </a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <a href="/blog" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">
                Reviews
              </a>
              <a href="/tools" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors">
                Tools Directory
              </a>

              {/* Categories dropdown */}
              <div className="relative group">
                <button className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1">
                  Categories
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {CATEGORIES.map((c) => (
                    <a key={c.href} href={c.href}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      {c.label}
                    </a>
                  ))}
                </div>
              </div>

              <a href="/search" className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </a>
            </div>

            {/* Right CTA + mobile menu */}
            <div className="flex items-center gap-2">
              <a href="/newsletter"
                className="hidden md:inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                📧 Weekly Picks
              </a>
              <MobileMenu />
            </div>
          </nav>
        </header>

        <main className="min-h-screen">{children}</main>

        <footer className="bg-slate-900 text-slate-400 py-14 mt-20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div>
                <p className="text-white font-bold text-lg mb-2" style={{fontFamily:'Sora,sans-serif'}}>🤖 {SITE_NAME}</p>
                <p className="text-sm leading-relaxed">Independent, hands-on reviews of AI tools. We test so you don&apos;t waste money.</p>
                <div className="flex gap-3 mt-4">
                  <a href={TWITTER_URL} className="text-slate-500 hover:text-white transition-colors text-lg" aria-label="Twitter">𝕏</a>
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
                  <li><a href="/search" className="hover:text-white transition-colors">Search</a></li>
                  <li><a href="/newsletter" className="hover:text-white transition-colors">Newsletter</a></li>
                  <li><a href="/about" className="hover:text-white transition-colors">About</a></li>
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
                  ⚠️ This site contains affiliate links. We may earn commissions at no cost to you.
                </div>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
              <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
              <p>Reviews written and edited by our team.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
