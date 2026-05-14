'use client';
import { useState, useEffect } from 'react';

const NAV_LINKS = [
  { href: '/blog', label: 'Reviews' },
  { href: '/tools', label: 'Tools Directory' },
  { href: '/blog?category=writing', label: '✍️ Writing' },
  { href: '/blog?category=coding', label: '💻 Coding' },
  { href: '/blog?category=design', label: '🎨 Design' },
  { href: '/blog?category=productivity', label: '⚡ Productivity' },
  { href: '/blog?category=chatbots', label: '💬 Chatbots' },
  { href: '/about', label: 'About' },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Open menu"
      >
        <span className="block w-5 h-0.5 bg-slate-700 rounded-full" />
        <span className="block w-5 h-0.5 bg-slate-700 rounded-full" />
        <span className="block w-4 h-0.5 bg-slate-700 rounded-full" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 animate-slideIn shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <a href="/" className="flex items-center gap-2 font-bold text-lg text-blue-600" style={{fontFamily:'Sora,sans-serif'}} onClick={() => setOpen(false)}>
                <span className="text-2xl">🤖</span>
                AI Tools Hub
              </a>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
