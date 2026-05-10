'use client';
import { useState } from 'react';
import type { TocItem } from '@/lib/posts';

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(true);

  if (!items.length) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden mb-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-bold text-slate-900 hover:bg-blue-100 transition-colors"
        style={{fontFamily:'Sora,sans-serif'}}
      >
        <span className="flex items-center gap-2">
          <span>📋</span> Table of Contents
        </span>
        <span className="text-slate-400 text-sm font-normal">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ol className="px-5 pb-4 space-y-1.5">
          {items.map((item, i) => (
            <li key={item.id}
              className={item.level === 3 ? 'ml-4' : ''}>
              <a
                href={`#${item.id}`}
                className="text-sm text-blue-700 hover:text-blue-900 hover:underline flex items-start gap-2 group"
              >
                <span className="text-blue-300 group-hover:text-blue-500 shrink-0 mt-0.5 font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                <span>{item.text}</span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
