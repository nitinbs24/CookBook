import { Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import * as reviewsApi from '../api/reviews.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { ConfirmDialog } from './Dialog.jsx';
import Rating from './Rating.jsx';
import ReviewForm from './ReviewForm.jsx';
import { ErrorState } from './States.jsx';

const dateFmt = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' });

/** Average, review list, and form (PRD F-45). `onChange` lets the page refresh its rating. */
export default function Reviews({ recipe, onChange }) {
  const { user, token, isAdmin } = useAuth();
  const toast = useToast();
  // shortcut: shows the newest 50 reviews only; add paging if a recipe ever gets more.
  const reviews = useAsync(() => reviewsApi.listReviews(recipe.id, { limit: 50 }), [recipe.id]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const items = reviews.data?.items ?? [];
  const isAuthor = user?.id === recipe.author.id;
  const reviewedByMe = items.some((r) => r.user.id === user?.id);
  const refresh = () => {
    reviews.reload();
    onChange();
  };

  async function remove() {
    setBusy(true);
    try {
      await reviewsApi.deleteReview(confirm.id);
      toast('Review deleted');
      refresh();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <section aria-labelledby="reviews-heading" className="flex flex-col gap-6">
      <div className="flex items-baseline gap-4">
        <h2 id="reviews-heading" className="text-2xl">Reviews</h2>
        <Rating avg={recipe.avgRating} count={recipe.reviewCount} />
      </div>

      {/* Hidden from the author; guests see it and get the sign-up prompt. Wait for the user to load. */}
      {!isAuthor && !reviewedByMe && (!token || user) && <ReviewForm recipeId={recipe.id} onPosted={refresh} />}
      {reviewedByMe && <p className="text-sm text-muted">You reviewed this recipe.</p>}

      {reviews.error ? (
        <ErrorState error={reviews.error} onRetry={reviews.reload} />
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {items.map((r) => (
            <li key={r.id} className="flex flex-col gap-1.5 py-4">
              <div className="flex items-center gap-3">
                <span className="font-medium">{r.user.name}</span>
                <span className="flex" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} strokeWidth={1.75} aria-hidden="true" className={n <= r.rating ? 'fill-accent text-accent' : 'text-muted'} />
                  ))}
                </span>
                <span className="text-sm text-muted">{dateFmt.format(new Date(r.createdAt))}</span>
                {(r.user.id === user?.id || isAdmin) && (
                  <button
                    type="button"
                    className="btn-ghost ml-auto h-8 w-8 px-0 text-muted hover:text-danger"
                    aria-label={`Delete review by ${r.user.name}`}
                    onClick={() => setConfirm(r)}
                  >
                    <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                )}
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
      {!reviews.loading && !reviews.error && !items.length && <p className="text-muted">No reviews yet.</p>}

      {confirm && (
        <ConfirmDialog
          title="Delete this review?"
          message={`${confirm.user.name}'s review will be removed and the rating recalculated.`}
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </section>
  );
}
