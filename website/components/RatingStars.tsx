export default function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'md' ? 'text-lg' : 'text-sm';
  return (
    <span className={`inline-flex gap-0.5 ${sizeClass}`} aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}>
          ★
        </span>
      ))}
      <span className="text-slate-500 font-medium ml-1" style={{fontSize:'0.8em'}}>{rating}</span>
    </span>
  );
}
