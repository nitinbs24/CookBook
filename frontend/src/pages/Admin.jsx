import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import * as adminApi from '../api/admin.js';
import * as recipesApi from '../api/recipes.js';
import { ConfirmDialog } from '../components/Dialog.jsx';
import Pagination from '../components/Pagination.jsx';
import Rating from '../components/Rating.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import VegMark from '../components/VegMark.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { categoryName } from '../lib/categories.js';

const LIMIT = 12;
const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });
const th = 'px-3 py-2.5 text-left text-xs font-medium text-muted';
const td = 'px-3 py-3 align-middle';

/** Recipes table with delete (PRD F-71, F-72). `load(paging)` returns a page of admin cards. */
function RecipesTable({ load, deps, page }) {
  const toast = useToast();
  const res = useAsync(() => load({ page, limit: LIMIT }), [...deps, page]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await recipesApi.deleteRecipe(confirm.id);
      toast('Recipe deleted');
      res.reload();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  if (res.data?.items.length === 0) {
    // Keep the page links: deleting the last row of the last page lands here.
    return (
      <>
        <EmptyState message="No recipes found." />
        <Pagination page={page} limit={LIMIT} total={res.data.total} />
      </>
    );
  }
  return (
    <>
      <table className="w-full border-collapse text-sm" aria-busy={res.loading}>
        <thead className="border-b border-line bg-surface">
          <tr>
            <th className={th}><span className="sr-only">Photo</span></th>
            <th className={th}>Title</th>
            <th className={th}>Author</th>
            <th className={th}>Category</th>
            <th className={th}>Type</th>
            <th className={th}>Rating</th>
            <th className={th}>Likes</th>
            <th className={th}>Added</th>
            <th className={th}><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {res.data?.items.map((r) => (
            <tr key={r.id}>
              <td className={td}><img src={r.image.url} alt="" className="size-12 rounded-md bg-surface object-cover" /></td>
              <td className={`${td} font-medium`}><Link to={`/recipes/${r.id}`} className="hover:text-accent">{r.title}</Link></td>
              <td className={td}>
                <span className="block">{r.author.name}</span>
                <span className="block text-xs text-muted">{r.author.email}</span>
              </td>
              <td className={td}>{categoryName(r.category)}</td>
              <td className={td}><VegMark foodType={r.foodType} /></td>
              <td className={td}><Rating avg={r.avgRating} count={r.reviewCount} /></td>
              <td className={`${td} tabular-nums`}>{r.likeCount}</td>
              <td className={`${td} text-muted`}>{dateFmt.format(new Date(r.createdAt))}</td>
              <td className={`${td} text-right`}>
                <button type="button" className="btn-ghost w-10 px-0 text-muted hover:text-danger" aria-label={`Delete ${r.title}`} onClick={() => setConfirm(r)}>
                  <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {res.data && <Pagination page={page} limit={LIMIT} total={res.data.total} />}
      {confirm && (
        <ConfirmDialog
          title="Delete this recipe?"
          message={`"${confirm.title}" by ${confirm.author.name}, with its reviews and likes, will be deleted.`}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

function UsersTable({ page }) {
  const res = useAsync(() => adminApi.adminUsers({ page, limit: LIMIT }), [page]);
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  return (
    <>
      <table className="w-full border-collapse text-sm" aria-busy={res.loading}>
        <thead className="border-b border-line bg-surface">
          <tr>
            <th className={th}>Name</th>
            <th className={th}>Email</th>
            <th className={th}>Role</th>
            <th className={th}>Recipes</th>
            <th className={th}>Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {res.data?.items.map((u) => (
            <tr key={u.id}>
              <td className={`${td} font-medium`}>
                <Link to={`?${new URLSearchParams({ tab: 'users', user: u.id, name: u.name })}`} className="hover:text-accent">{u.name}</Link>
              </td>
              <td className={td}>{u.email}</td>
              <td className={td}>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${u.role === 'admin' ? 'border-accent text-accent' : 'border-line text-muted'}`}>{u.role}</span>
              </td>
              <td className={`${td} tabular-nums`}>{u.recipeCount}</td>
              <td className={`${td} text-muted`}>{dateFmt.format(new Date(u.createdAt))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {res.data && <Pagination page={page} limit={LIMIT} total={res.data.total} />}
    </>
  );
}

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'users' ? 'users' : 'recipes';
  const page = Number(params.get('page')) || 1;
  const q = params.get('q') || undefined;
  const userId = params.get('user');
  const tabLink = (value, label) => (
    <Link
      to={`?tab=${value}`}
      aria-current={tab === value ? 'page' : undefined}
      className={`-mb-px border-b-2 px-1 pb-3 text-sm font-medium ${tab === value ? 'border-fg' : 'border-transparent text-muted hover:text-fg'}`}
    >
      {label}
    </Link>
  );

  return (
    <section>
      <h1 className="text-[32px] leading-10">Admin</h1>
      <nav aria-label="Admin sections" className="mt-6 mb-8 flex gap-6 border-b border-line">
        {tabLink('recipes', 'Recipes')}
        {tabLink('users', 'Users')}
      </nav>

      {tab === 'recipes' && (
        <>
          <form
            role="search"
            className="mb-6 flex w-96 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get('q').trim();
              setParams(value ? { tab, q: value } : { tab });
            }}
          >
            <input type="search" name="q" defaultValue={q} aria-label="Search recipes by title" placeholder="Search by title" className="input" />
            <button type="submit" className="btn-secondary">Search</button>
          </form>
          <RecipesTable load={(paging) => adminApi.adminRecipes({ q, ...paging })} deps={[q]} page={page} />
        </>
      )}

      {tab === 'users' && !userId && <UsersTable page={page} />}
      {tab === 'users' && userId && (
        <>
          <Link to="?tab=users" className="link text-sm">← All users</Link>
          <h2 className="mt-3 mb-6 text-2xl">{params.get('name')}'s recipes</h2>
          <RecipesTable load={(paging) => adminApi.userRecipes(userId, paging)} deps={[userId]} page={page} />
        </>
      )}
    </section>
  );
}
