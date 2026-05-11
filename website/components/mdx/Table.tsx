import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export function Table(props: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto my-8 rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm" {...props} />
    </div>
  );
}

export function Thead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="bg-sky-600 text-white" {...props} />;
}

export function Tbody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function Th(props: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className="px-4 py-3 text-left font-semibold text-sm whitespace-nowrap text-white"
      {...props}
    />
  );
}

export function Tr(props: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className="hover:bg-sky-50 transition-colors even:bg-gray-50 first:bg-amber-50 first:font-medium"
      {...props}
    />
  );
}

export function Td(props: TdHTMLAttributes<HTMLTableCellElement>) {
  const text = String(props.children ?? '');
  const trimmed = text.trim();

  // Star ratings — ★ and ☆ only
  const isStars = /^[★☆]+$/.test(trimmed) && trimmed.length >= 1 && trimmed.length <= 10;

  // ✓ free tier / trial — green badge
  const isFree = trimmed.startsWith('✓');

  // ✗ paid only — muted badge
  const isPaid = trimmed.startsWith('✗');

  // $ price — bold
  const isPrice = trimmed.startsWith('$');

  return (
    <td className="px-4 py-3 border-t border-gray-100 align-middle">
      {isStars ? (
        <span className="text-amber-400 text-base tracking-tight" aria-label={trimmed}>
          {props.children}
        </span>
      ) : isFree ? (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
          {props.children}
        </span>
      ) : isPaid ? (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
          {props.children}
        </span>
      ) : isPrice ? (
        <span className="font-semibold text-gray-900">{props.children}</span>
      ) : (
        <span className="text-gray-600">{props.children}</span>
      )}
    </td>
  );
}
