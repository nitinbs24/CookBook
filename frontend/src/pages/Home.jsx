import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import * as recipesApi from '../api/recipes.js';
import CategoryTile from '../components/CategoryTile.jsx';
import Pagination from '../components/Pagination.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import { CardGrid, ErrorState } from '../components/States.jsx';
import { useFoodType } from '../context/FoodTypeContext.jsx';
import { useAsync } from '../hooks/useAsync.js';

const LIMIT = 12;

function Trending({ items }) {
  const strip = useRef(null);
  const scroll = (dir) => strip.current.scrollBy({ left: dir * strip.current.clientWidth, behavior: 'smooth' });
  return (
    <section aria-labelledby="trending-heading">
      <div className="mb-6 flex items-center justify-between">
        <h2 id="trending-heading" className="text-2xl">Trending this week</h2>
        {items.length > 4 && (
          <div className="flex gap-1">
            <button type="button" className="btn-ghost w-10 px-0" aria-label="Scroll trending left" onClick={() => scroll(-1)}>
              <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button type="button" className="btn-ghost w-10 px-0" aria-label="Scroll trending right" onClick={() => scroll(1)}>
              <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div ref={strip} className="flex snap-x gap-6 overflow-x-auto pb-2">
        {items.map((r) => (
          <div key={r.id} className="w-[calc((100%-72px)/4)] shrink-0 snap-start">
            <RecipeCard recipe={r} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { apiFoodType } = useFoodType();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') || undefined;
  const [text, setText] = useState(q ?? '');

  const trending = useAsync(() => recipesApi.trending({ foodType: apiFoodType }), [apiFoodType]);
  const categories = useAsync(() => recipesApi.categories({ foodType: apiFoodType }), [apiFoodType]);
  const latest = useAsync(() => recipesApi.listRecipes({ foodType: apiFoodType, q, page, limit: LIMIT }), [apiFoodType, q, page]);

  // URL → box: Back/forward changes ?q; keep what's typed if it already matches (e.g. a trailing space).
  useEffect(() => setText((t) => (t.trim() === (q ?? '') ? t : q ?? '')), [q]);

  // Box → URL: debounced search updates ?q 300 ms after typing stops, back to page 1.
  useEffect(() => {
    const value = text.trim();
    if (value === (q ?? '')) return undefined;
    const timer = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set('q', value);
        else next.delete('q');
        next.delete('page');
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [text, q, setParams]);

  return (
    <div className="flex flex-col gap-16">
      {trending.data?.length > 0 && <Trending items={trending.data} />}

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-6 text-2xl">Browse by ingredient</h2>
        {categories.error ? (
          <ErrorState error={categories.error} onRetry={categories.reload} />
        ) : (
          <div className="grid grid-cols-5 gap-6">
            {categories.data?.map((c) => <CategoryTile key={c.slug} category={c} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="latest-heading">
        <div className="mb-6 flex items-center justify-between gap-6">
          <h2 id="latest-heading" className="text-2xl">{q ? `Results for “${q}”` : 'Latest recipes'}</h2>
          <div className="relative w-80">
            <Search size={16} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute top-3 left-3 text-muted" />
            <input
              type="search"
              aria-label="Search recipes"
              placeholder="Search by title or dish"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>
        {latest.error ? (
          <ErrorState error={latest.error} onRetry={latest.reload} />
        ) : (
          <>
            <CardGrid items={latest.data?.items} loading={latest.loading} empty={q ? `No recipes match “${q}”.` : 'No recipes yet.'} />
            {latest.data && <Pagination page={page} limit={LIMIT} total={latest.data.total} />}
          </>
        )}
      </section>
    </div>
  );
}
