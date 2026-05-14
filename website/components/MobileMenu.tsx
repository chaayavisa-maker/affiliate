'use client';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { href: '/blog', label: 'Reviews' },
  { href: '/tools', label: 'Tools Directory' },
  { href: '/search', label: '🔍 Search' },
  { section: 'Categories', links: [
    { href: '/blog?category=writing', label: '✍️ Writing' },
    { href: '/blog?category=coding', label: '💻 Coding' },
    { href: '/blog?category=design', label: '🎨 Design' },
    { href: '/blog?category=productivity', label: '⚡ Productivity' },
    { href: '/blog?category=chatbots', label: '💬 Chatbots' },
    { href: '/blog?category=video', label: '🎬 Video' },
  ]},
  { section: 'More', links: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/affiliate-disclosure', label: 'Affiliate Disclosure' },
  ]},
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <span className="block w-5 h-0.5 bg-slate-700 rounded-full" aria-hidden="true" />
        <span className="block w-5 h-0.5 bg-slate-700 rounded-full" aria-hidden="true" />
        <span className="block w-4 h-0.5 bg-slate-700 rounded-full" aria-hidden="true" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={() => setOpen(false)}
            aria-hidden="true"
            role="presentation"
          />
          {/* Drawer */}
          <div
            id="mobile-menu"
            className="fixed inset-y-0 left-0 w-72 bg-white z-50 animate-slideIn shadow-2xl flex flex-col"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <a
                href="/"
                className="flex items-center gap-2 font-bold text-lg text-blue-600"
                style={{fontFamily:'Sora,sans-serif'}}
                onClick={() => setOpen(false)}
                aria-label="AI Tools Hub home"
              >
                <span className="text-2xl" aria-hidden="true">🤖</span>
                <span className="hidden xs:inline">AI Tools Hub</span>
              </a>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close navigation menu"
                type="button"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Main links */}
              {NAV_LINKS.filter(l => !l.section).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  {link.label}
                </a>
              ))}

              {/* Category section */}
              {NAV_LINKS.filter(l => l.section === 'Categories').map((section) => (
                <div key={section.section}>
                  <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">{section.section}</p>
                  {section.links?.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-blue-700 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}

              {/* More section */}
              {NAV_LINKS.filter(l => l.section === 'More').map((section) => (
                <div key={section.section}>
                  <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-3">{section.section}</p>
                  {section.links?.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-blue-700 text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 text-xs text-slate-500">
              <p>© 2026 AI Tools Hub. Independent reviews.</p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
