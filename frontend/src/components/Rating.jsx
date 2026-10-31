import { Star } from 'lucide-react';

export default function Rating({ avg, count }) {
  if (!count) return <span className="text-xs text-muted">No reviews</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Star size={14} strokeWidth={1.75} className="fill-accent text-accent" aria-hidden="true" />
      <span className="font-medium">{avg.toFixed(1)}</span>
      <span className="text-muted">({count})</span>
    </span>
  );
}
