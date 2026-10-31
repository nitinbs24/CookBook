import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

/** light | dark | system, stored as rb_theme. index.html applies it before first paint. */
export function ThemeProvider({ children }) {
  const [theme, setState] = useState(() => {
    const saved = localStorage.getItem('rb_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  });

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && query.matches));
    apply();
    if (theme !== 'system') return undefined;
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [theme]);

  const setTheme = (value) => {
    if (value === 'system') localStorage.removeItem('rb_theme');
    else localStorage.setItem('rb_theme', value);
    setState(value);
  };
  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>;
}

export const useTheme = () => useContext(ThemeContext);
