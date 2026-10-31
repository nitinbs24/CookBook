import { Link, useSearchParams } from 'react-router';
import * as likesApi from '../api/likes.js';
import * as recipesApi from '../api/recipes.js';
import Pagination from '../components/Pagination.jsx';
import { CardGrid, EmptyState, ErrorState } from '../components/States.jsx';
import { useFoodType } from '../context/FoodTypeContext.jsx';
import { useAsync } from '../hooks/useAsync.js';

const LIMIT = 12;

/** A paginated card list that follows the veg / non-veg toggle (PRD F-11). */
function CardListPage({ title, load, emptyMessage, emptyLink }) {
  const { apiFoodType } = useFoodType();
  const [params] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const res = useAsync(() => load({ foodType: apiFoodType, page, limit: LIMIT }), [apiFoodType, page]);
  return (
    <section>
      <h1 className="mb-8 text-[32px] leading-10">{title}</h1>
      {res.error && <ErrorState error={res.error} onRetry={res.reload} />}
      {res.data?.items.length === 0 ? (
        <EmptyState message={emptyMessage}>{emptyLink}</EmptyState>
      ) : (
        !res.error && <CardGrid items={res.data?.items} loading={res.loading} />
      )}
      {res.data && <Pagination page={page} limit={LIMIT} total={res.data.total} />}
    </section>
  );
}

export function MyRecipes() {
  return (
    <CardListPage
      title="My recipes"
      load={recipesApi.myRecipes}
      emptyMessage="You haven't posted a recipe yet."
      emptyLink={<Link to="/recipes/new" className="btn-primary">Add recipe</Link>}
    />
  );
}

export function WantToTry() {
  return (
    <CardListPage
      title="Want to try"
      load={likesApi.myLikes}
      emptyMessage="Like a recipe to save it here."
      emptyLink={<Link to="/home" className="btn-secondary">Browse recipes</Link>}
    />
  );
}
