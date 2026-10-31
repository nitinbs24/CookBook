import { Star } from 'lucide-react';
import { useId, useState } from 'react';
import * as reviewsApi from '../api/reviews.js';
import { useAuth } from '../context/AuthContext.jsx';
import { GuestPrompt } from './Dialog.jsx';

/** 1–5 stars as real radio inputs (arrow keys work) plus an optional comment (PRD F-62). */
export default function ReviewForm({ recipeId, onPosted }) {
  const { token } = useAuth();
  const id = useId();
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) return setPrompt(true);
    setFormError('');
    if (!rating) return setRatingError('Choose a rating from 1 to 5 stars');
    setRatingError('');
    setSaving(true);
    try {
      await reviewsApi.createReview(recipeId, { rating, comment: comment.trim() || null });
      onPosted();
    } catch (err) {
      if (err.code === 'CONFLICT') onPosted(); // already reviewed: same end state
      else setFormError(err.message);
    } finally {
      setSaving(false);
    }
    return undefined;
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
      <div>
        <p id={`${id}-label`} className="text-sm font-medium">Rating</p>
        <div
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-describedby={ratingError ? `${id}-error` : undefined}
          className="mt-2 flex gap-1"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-sm has-focus-visible:outline-2 has-focus-visible:outline-accent">
              <input
                type="radio"
                name={`${id}-rating`}
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                className="sr-only"
                aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
              />
              <Star
                size={24}
                strokeWidth={1.75}
                aria-hidden="true"
                className={rating >= n ? 'fill-accent text-accent' : 'text-muted'}
              />
            </label>
          ))}
        </div>
        {ratingError && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{ratingError}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-comment`} className="text-sm font-medium">Comment (optional)</label>
        <textarea
          id={`${id}-comment`}
          rows={3}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="input h-auto py-2"
        />
      </div>
      {formError && <p role="alert" className="text-sm text-danger">{formError}</p>}
      <button type="submit" className="btn-primary self-start" disabled={saving}>{saving ? 'Posting…' : 'Post review'}</button>
      {prompt && <GuestPrompt onClose={() => setPrompt(false)} />}
    </form>
  );
}
