import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';

/** Lets tests change the URL like a browser Back/forward would. */
function ExposeNavigate() {
  window.__testNavigate = useNavigate();
  return null;
}
import { AuthProvider } from '../context/AuthContext.jsx';
import { FoodTypeProvider } from '../context/FoodTypeContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';

/** Renders `ui` inside all providers and a router at `route`, plus `extraRoutes` to observe redirects. */
export function renderApp(ui, { route = '/', path = '*', extraRoutes = {} } = {}) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <FoodTypeProvider>
          <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <ExposeNavigate />
            <Routes>
              <Route path={path} element={ui} />
              {Object.entries(extraRoutes).map(([p, label]) => (
                <Route key={p} path={p} element={<p>{label}</p>} />
              ))}
            </Routes>
          </MemoryRouter>
          </ToastProvider>
        </FoodTypeProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}
