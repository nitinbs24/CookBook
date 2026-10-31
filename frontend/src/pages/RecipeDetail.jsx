import { ChefHat, Clock, Flame, Pencil, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import * as recipesApi from '../api/recipes.js';
import { ConfirmDialog } from '../components/Dialog.jsx';
import LikeButton from '../components/LikeButton.jsx';
import Rating from '../components/Rating.jsx';
import { ImageGallery, IngredientList, InstructionSections } from '../components/RecipeParts.jsx';
import Reviews from '../components/Reviews.jsx';
import { ErrorState } from '../components/States.jsx';
import VegMark from '../components/VegMark.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { categoryName } from '../lib/categories.js';

const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

export default function RecipeDetail() {
  const { id } = useParams();
  const { user, token, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  // Refetch when the login changes so likedByMe matches the viewer.
  const recipe = useAsync(() => recipesApi.getRecipe(id), [id, token]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (recipe.error?.status === 404) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-[32px] leading-10">Recipe not found</h1>
        <p className="mt-2 text-muted">It may have been deleted.</p>
        <Link to="/home" className="btn-secondary mt-8">Back to recipes</Link>
      </section>
    );
  }
  if (recipe.error) return <ErrorState error={recipe.error} onRetry={recipe.reload} />;
  if (!recipe.data) return <div aria-busy="true" className="grid grid-cols-12 gap-10"><div className="col-span-7 aspect-[4/3] rounded-lg bg-surface" /><div className="col-span-5 h-64 rounded-lg bg-surface" /></div>;

  const r = recipe.data;
  const canDelete = user && (user.id === r.author.id || isAdmin);

  async function remove() {
    setBusy(true);
    try {
      await recipesApi.deleteRecipe(r.id);
      toast('Recipe deleted');
      navigate('/home');
    } catch (err) {
      toast(err.message);
      setBusy(false);
      setConfirm(false);
    }
  }

  const stats = [
    [Clock, 'Prep', `${r.prepTimeMin} min`],
    [Flame, 'Cook', `${r.cookTimeMin} min`],
    [Users, 'Serves', r.servings],
    [ChefHat, 'Difficulty', r.difficulty[0].toUpperCase() + r.difficulty.slice(1)],
  ];

  return (
    <article className="flex flex-col gap-12">
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-7">
          <ImageGallery images={r.images} title={r.title} />
        </div>
        <div className="col-span-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <VegMark foodType={r.foodType} />
            <Link to={`/category/${r.category}`} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:text-fg">
              {categoryName(r.category)}
            </Link>
          </div>
          <div>
            <h1 className="text-[32px] leading-10">{r.title}</h1>
            <Link to={`/category/${r.category}?${new URLSearchParams({ dish: r.dishName })}`} className="mt-1 block text-muted hover:text-accent">
              {r.dishName}
            </Link>
          </div>
          <p className="text-sm text-muted">
            By <span className="font-medium text-fg">{r.author.name}</span> · {dateFmt.format(new Date(r.createdAt))}
          </p>
          <dl className="grid grid-cols-4 gap-4 border-y border-line py-4">
            {stats.map(([Icon, label, value]) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 text-xs text-muted">
                  <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-4">
            <LikeButton key={`${r.id}-${token}`} recipeId={r.id} liked={r.likedByMe} count={r.likeCount} />
            <Rating avg={r.avgRating} count={r.reviewCount} />
            {user?.id === r.author.id && (
              <Link to={`/recipes/${r.id}/edit`} className="btn-ghost ml-auto">
                <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
                Edit
              </Link>
            )}
            {canDelete && (
              <button type="button" className={`btn-ghost text-danger ${user?.id === r.author.id ? '' : 'ml-auto'}`} onClick={() => setConfirm(true)}>
                <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                Delete recipe
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-7 flex flex-col gap-8">
          {r.description && <p className="text-lg">{r.description}</p>}
          <section aria-labelledby="steps-heading">
            <h2 id="steps-heading" className="mb-6 text-2xl">Instructions</h2>
            <InstructionSections instructions={r.instructions} />
          </section>
        </div>
        <aside className="col-span-5">
          <section aria-labelledby="ingredients-heading" className="sticky top-[88px] rounded-lg border border-line p-5">
            <h2 id="ingredients-heading" className="mb-2 text-2xl">Ingredients</h2>
            <IngredientList ingredients={r.ingredients} />
          </section>
        </aside>
      </div>

      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-7">
          <Reviews recipe={r} onChange={recipe.reload} />
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Delete this recipe?"
          message={`"${r.title}" and all its reviews and likes will be deleted. This can't be undone.`}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirm(false)}
        />
      )}
    </article>
  );
}
