export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto my-8 rounded-2xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-sky-600 text-white">{children}</thead>;
}

export function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-semibold text-sm whitespace-nowrap">{children}</th>;
}

export function Td({ children }: { children: React.ReactNode }) {
  const text = String(children);
  const isStars = /^[★☆]+$/.test(text.trim());
  const isFree = text.toLowerCase().includes('free') || text.toLowerCase().includes('✓');
  const isPrice = text.includes('$');

  return (
    <td className="px-4 py-3 border-t border-gray-100 align-middle">
      {isStars ? (
        <span className="text-amber-400 text-base tracking-tight">{text}</span>
      ) : isFree ? (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
          ✓ {text}
        </span>
      ) : isPrice ? (
        <span className="font-semibold text-gray-900">{text}</span>
      ) : (
        <span className="text-gray-600">{text}</span>
      )}
    </td>
  );
}

export function Tr({ children, index }: { children: React.ReactNode; index?: number }) {
  return (
    <tr className="hover:bg-sky-50 transition-colors even:bg-gray-50">
      {children}
    </tr>
  );
}
