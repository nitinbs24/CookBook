import RecipeCard from './RecipeCard.jsx';

export function EmptyState({ message, children }) {
  return (
    <div className="rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <p className="text-muted">{message}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <EmptyState message={error?.message ?? 'Something went wrong'}>
      <button type="button" className="btn-secondary" onClick={onRetry}>Try again</button>
    </EmptyState>
  );
}

/** 4-column card grid with skeletons on first load and an empty state (UI brief §6). */
export function CardGrid({ items, loading, empty = 'No recipes match yet.' }) {
  if (!items) {
    if (!loading) return null;
    return (
      <div className="grid grid-cols-4 gap-6" aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="aspect-[4/5] rounded-lg bg-surface" />
        ))}
      </div>
    );
  }
  if (!items.length) return <EmptyState message={empty} />;
  return (
    <div className="grid grid-cols-4 gap-6" aria-busy={loading}>
      {items.map((r) => <RecipeCard key={r.id} recipe={r} />)}
    </div>
  );
}
