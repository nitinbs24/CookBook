import { useAuth } from '../context/AuthContext.jsx';

// Trending, category tiles, and latest recipes arrive in Phase 5.
export default function Home() {
  const { user, isGuest } = useAuth();
  return (
    <section>
      <h1 className="text-[32px] leading-10">{user ? `Welcome, ${user.name}` : 'Welcome'}</h1>
      <p className="mt-2 text-muted">{isGuest ? 'You are browsing as a guest.' : 'What are you cooking today?'}</p>
    </section>
  );
}
