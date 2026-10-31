import { Heart } from 'lucide-react';
import { useState } from 'react';
import * as likesApi from '../api/likes.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { GuestPrompt } from './Dialog.jsx';

/** Optimistic like toggle (TRD §11): flips at once, keeps the server count, reverts on failure. */
export default function LikeButton({ recipeId, liked: initialLiked, count: initialCount }) {
  const { token } = useAuth();
  const toast = useToast();
  const [state, setState] = useState({ liked: initialLiked, count: initialCount });
  const [busy, setBusy] = useState(false);
  const [prompt, setPrompt] = useState(false);

  async function toggle() {
    if (!token) return setPrompt(true);
    if (busy) return undefined;
    const before = state;
    setBusy(true);
    setState({ liked: !before.liked, count: before.count + (before.liked ? -1 : 1) });
    try {
      const res = await (before.liked ? likesApi.unlike(recipeId) : likesApi.like(recipeId));
      setState({ liked: res.liked, count: res.likeCount });
    } catch (err) {
      setState(before);
      toast(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={state.liked}
        aria-label={`${state.liked ? 'Unlike' : 'Like'} (${state.count} likes)`}
        className="btn-secondary"
      >
        <Heart size={20} strokeWidth={1.75} aria-hidden="true" className={state.liked ? 'fill-accent text-accent' : ''} />
        {state.count}
      </button>
      {prompt && <GuestPrompt onClose={() => setPrompt(false)} />}
    </>
  );
}
