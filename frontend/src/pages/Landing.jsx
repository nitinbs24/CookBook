import { Heart, LayoutGrid, Leaf } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  [LayoutGrid, 'Browse by main ingredient', 'Paneer, chicken, dal, biryani: every cook’s version in one place.'],
  [Leaf, 'Veg / non-veg everywhere', 'One switch filters every list, so you only see what you eat.'],
  [Heart, 'Save what you want to try', 'Like a recipe to keep it on your Want to try list.'],
];

export default function Landing() {
  const { token, isGuest, loading, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  if (loading) return null;
  if (token || isGuest) return <Navigate to="/home" replace />;

  return (
    <main className="mx-auto flex min-h-screen max-w-[960px] flex-col justify-center px-10 py-24">
      <div className="mx-auto max-w-[640px] text-center">
        <p className="text-sm font-medium text-muted">Recipe Book</p>
        <h1 className="mt-4 text-5xl leading-[56px] font-bold tracking-[-0.02em]">Cook what other home cooks swear by.</h1>
        <p className="mt-6 text-lg text-muted">
          Step-by-step recipes shared by people who actually make them. Find a dish, follow along, and tell others how it went.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link to="/register" className="btn-primary">Sign up</Link>
          <Link to="/login" className="btn-secondary">Log in</Link>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              continueAsGuest();
              navigate('/home');
            }}
          >
            Continue as guest
          </button>
        </div>
      </div>
      <ul className="mt-24 grid grid-cols-3 gap-8 border-t border-line pt-12">
        {FEATURES.map(([Icon, title, text]) => (
          <li key={title}>
            <Icon size={20} strokeWidth={1.75} className="text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-base">{title}</h2>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
