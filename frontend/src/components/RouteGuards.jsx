import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';

/** Logged-in users and guests (TRD §11: /home without either goes to the landing page). */
export function SessionRoute() {
  const { token, isGuest, loading } = useAuth();
  if (loading) return null;
  return token || isGuest ? <Outlet /> : <Navigate to="/" replace />;
}

/** Logged-in users only; guests are sent to /login and come back afterwards. */
export function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  return token ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

/** Admins only. The API enforces this too (403); this just hides the page. */
export function AdminRoute() {
  const { token, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return isAdmin ? <Outlet /> : <Navigate to="/home" replace />;
}
