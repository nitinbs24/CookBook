import { X } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router';
import * as recipesApi from '../api/recipes.js';
import Pagination from '../components/Pagination.jsx';
import { CardGrid, ErrorState } from '../components/States.jsx';
import { useFoodType } from '../context/FoodTypeContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { categoryName } from '../lib/categories.js';

const LIMIT = 12;

export default function Category() {
  const { slug } = useParams();
  const { apiFoodType } = useFoodType();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const dish = params.get('dish') || undefined;

  const recipes = useAsync(
    () => recipesApi.listRecipes({ category: slug, dish, foodType: apiFoodType, page, limit: LIMIT }),
    [slug, dish, apiFoodType, page],
  );
  const name = categoryName(slug);

  return (
    <section>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to="/home" className="hover:text-fg">Home</Link> <span aria-hidden="true">/</span> {name}
      </nav>
      <div className="mt-3 mb-8 flex items-center gap-4">
        <h1 className="text-[32px] leading-10">{name}</h1>
        {recipes.data && <span className="text-muted">{recipes.data.total} {recipes.data.total === 1 ? 'recipe' : 'recipes'}</span>}
        {dish && (
          <button
            type="button"
            className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1 text-sm hover:border-fg/40"
            aria-label={`Clear dish filter: ${dish}`}
            onClick={() => setParams({})}
          >
            {dish}
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>
      {recipes.error ? (
        <ErrorState error={recipes.error} onRetry={recipes.reload} />
      ) : (
        <>
          <CardGrid items={recipes.data?.items} loading={recipes.loading} empty="No recipes here for this filter yet." />
          {recipes.data && <Pagination page={page} limit={LIMIT} total={recipes.data.total} />}
        </>
      )}
    </section>
  );
}
