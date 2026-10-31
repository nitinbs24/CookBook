import { Link, useSearchParams } from 'react-router';

/** Prev · 1 2 3 · Next, as links that set ?page= and keep the other query params. */
export default function Pagination({ page, limit, total }) {
  const [params] = useSearchParams();
  const pages = Math.ceil(total / limit);
  if (pages <= 1 && page <= 1) return null; // past the end (e.g. after a filter change), still offer a way back
  const href = (n) => {
    const next = new URLSearchParams(params);
    next.set('page', String(n));
    return `?${next}`;
  };
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1 text-sm">
      {page > 1 && <Link to={href(page - 1)} className="btn-ghost">Prev</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link
          key={n}
          to={href(n)}
          aria-label={`Page ${n}`}
          aria-current={n === page ? 'page' : undefined}
          className={`btn-ghost w-10 px-0 ${n === page ? 'font-semibold underline underline-offset-4' : 'text-muted'}`}
        >
          {n}
        </Link>
      ))}
      {page < pages && <Link to={href(page + 1)} className="btn-ghost">Next</Link>}
    </nav>
  );
}
