import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router';

/**
 * Native modal <dialog>: the browser traps focus, closes on Escape, and returns focus afterwards.
 * Render it only while open; `onClose` fires on Escape, backdrop click, or a button.
 */
export default function Dialog({ title, children, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => ref.current.showModal(), []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="m-auto w-[440px] rounded-lg border border-line bg-bg text-fg backdrop:bg-black/40"
    >
      {/* Padding lives here so a click inside the box never lands on <dialog> itself (= backdrop). */}
      <div className="p-6">
        <h2 id={titleId} className="text-xl">{title}</h2>
        {children}
      </div>
    </dialog>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <p className="mt-2 text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

/** PRD F-5: guests see like and review buttons, but get this instead. */
export function GuestPrompt({ onClose }) {
  return (
    <Dialog title="Sign up to like and review recipes" onClose={onClose}>
      <p className="mt-2 text-muted">It takes a few seconds, and your likes are saved to Want to try.</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onClose}>Not now</button>
        <Link to="/login" className="btn-secondary">Log in</Link>
        <Link to="/register" className="btn-primary">Sign up</Link>
      </div>
    </Dialog>
  );
}
