import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Table  –  premium comparison table for MDX blog posts
   Handles: ★/☆ stars → SVG renders, ✓/✗ free-plan badges, $ prices, plain text
───────────────────────────────────────────────────────────────────────────── */

export function Table(props: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-10 not-prose">
      {/* Pre-table label bar */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
            📊 Quick Comparison
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wide">
          <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
          Top row = best pick
        </span>
      </div>

      {/* Card wrapper */}
      <div className="rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden ring-1 ring-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" {...props} />
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-slate-400 mt-2 px-0.5">
        Scroll horizontally on mobile · Prices may vary — check official sites for current offers
      </p>
    </div>
  );
}

export function Thead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900"
      {...props}
    />
  );
}

export function Tbody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="bg-white" {...props} />;
}

export function Th(props: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 whitespace-nowrap first:text-slate-200 first:tracking-normal first:text-xs first:font-semibold"
      {...props}
    />
  );
}

export function Tr(props: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className="
        group relative transition-colors duration-150
        border-b border-slate-100 last:border-0
        even:bg-slate-50/70
        hover:bg-blue-50/50
        first:bg-gradient-to-r first:from-amber-50 first:to-yellow-50/60
        first:shadow-[inset_4px_0_0_#f59e0b]
      "
      {...props}
    />
  );
}

/* ── Star helper ── */
function StarRating({ text }: { text: string }) {
  const filled = (text.match(/★/g) || []).length;
  const total = text.length;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <svg
          key={i}
          className={`w-[15px] h-[15px] shrink-0 transition-colors ${
            i < filled ? 'text-amber-400' : 'text-slate-200'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-[11px] font-semibold text-slate-400 tabular-nums">
        {filled}/{total}
      </span>
    </span>
  );
}

export function Td(props: TdHTMLAttributes<HTMLTableCellElement>) {
  const text    = String(props.children ?? '');
  const trimmed = text.trim();

  const isStars = /^[★☆]+$/.test(trimmed) && trimmed.length >= 1 && trimmed.length <= 10;
  const isFree  = trimmed.startsWith('✓');
  const isPaid  = trimmed.startsWith('✗');
  const isPrice = trimmed.startsWith('$');

  return (
    <td className="px-5 py-3.5 align-middle first:font-semibold first:text-slate-900">

      {isStars ? (
        <StarRating text={trimmed} />
      ) : isFree ? (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
          {/* checkmark */}
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
          {/* strip the leading ✓ to avoid duplicate symbol */}
          {trimmed.replace(/^✓\s*/, '')}
        </span>
      ) : isPaid ? (
        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 text-[11px] font-medium px-2.5 py-1 rounded-full border border-slate-200 whitespace-nowrap">
          {/* x mark */}
          <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l6 6M9 3l-6 6" />
          </svg>
          {trimmed.replace(/^✗\s*/, '')}
        </span>
      ) : isPrice ? (
        <span className="inline-flex items-center gap-1 font-bold text-slate-900 tabular-nums">
          <span className="text-slate-400 text-[11px] font-normal mr-0.5">from</span>
          {props.children}
        </span>
      ) : (
        <span className="text-slate-600 leading-snug">{props.children}</span>
      )}
    </td>
  );
}
