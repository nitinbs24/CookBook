import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AuthProvider } from '../context/AuthContext.jsx';
import { FoodTypeProvider } from '../context/FoodTypeContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';

/** Renders `ui` inside all providers and a router at `route`, plus `extraRoutes` to observe redirects. */
export function renderApp(ui, { route = '/', path = '*', extraRoutes = {} } = {}) {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <FoodTypeProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={ui} />
              {Object.entries(extraRoutes).map(([p, label]) => (
                <Route key={p} path={p} element={<p>{label}</p>} />
              ))}
            </Routes>
          </MemoryRouter>
        </FoodTypeProvider>
      </AuthProvider>
    </ThemeProvider>,
  );
}
