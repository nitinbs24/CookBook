import { ChevronDown, Monitor, Moon, Plus, Sun } from 'lucide-react';
import { startTransition, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { useFoodType } from '../context/FoodTypeContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const FOOD_TYPES = [
  ['both', 'Both'],
  ['veg', 'Veg'],
  ['nonveg', 'Non-veg'],
];

/** Segmented control built on real radio inputs, so arrow keys and screen readers work for free. */
function FoodTypeToggle() {
  const { foodType, setFoodType } = useFoodType();
  return (
    <fieldset className="flex rounded-full border border-line p-1">
      <legend className="sr-only">Food type</legend>
      {FOOD_TYPES.map(([value, label]) => (
        <label
          key={value}
          className="flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 has-checked:bg-primary has-checked:text-on-primary has-focus-visible:outline-2 has-focus-visible:outline-accent"
        >
          <input
            type="radio"
            name="foodType"
            value={value}
            checked={foodType === value}
            onChange={() => setFoodType(value)}
            className="sr-only"
          />
          {value !== 'both' && (
            <span aria-hidden="true" className={`size-2 rounded-full ${value === 'veg' ? 'bg-veg' : 'bg-nonveg'}`} />
          )}
          {label}
        </label>
      ))}
    </fieldset>
  );
}

const THEMES = { system: ['light', Monitor], light: ['dark', Sun], dark: ['system', Moon] };

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [next, Icon] = THEMES[theme];
  return (
    <button type="button" className="btn-ghost w-10 px-0" onClick={() => setTheme(next)} aria-label={`Theme: ${theme}. Switch to ${next}`}>
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

/** Native <details> dropdown; closes on any choice and on clicks outside. */
function AccountMenu() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && (ref.current.open = false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  const item = 'block rounded-md px-3 py-2 text-left text-sm hover:bg-surface';
  return (
    <details
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !ref.current.open) return;
        ref.current.open = false;
        ref.current.querySelector('summary').focus();
      }}
    >
      <summary className="btn-ghost list-none [&::-webkit-details-marker]:hidden">
        {user?.name ?? 'Account'}
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
      </summary>
      <div
        className="absolute right-0 mt-2 flex w-48 flex-col rounded-lg border border-line bg-bg p-1 shadow-[0_1px_2px_rgb(0_0_0/0.06)]"
        onClick={() => {
          ref.current.open = false;
        }}
      >
        <Link to="/me/recipes" className={item}>My recipes</Link>
        <Link to="/me/likes" className={item}>Want to try</Link>
        {isAdmin && <Link to="/admin" className={item}>Admin</Link>}
        <button
          type="button"
          className={`${item} cursor-pointer border-t border-line text-danger`}
          onClick={() => {
            // React Router navigates inside a transition; clearing the token in the same transition makes
            // both land in one render. Otherwise a protected page sees "no token" first and redirects to /login.
            startTransition(() => {
              navigate('/');
              logout();
            });
          }}
        >
          Log out
        </button>
      </div>
    </details>
  );
}

export default function Navbar() {
  const { token } = useAuth();
  return (
    <header className="sticky top-0 z-10 h-16 border-b border-line bg-surface">
      <div className="mx-auto grid h-full max-w-[1200px] grid-cols-3 items-center px-10">
        <Link to="/home" className="text-lg font-semibold tracking-tight">
          Recipe Book
        </Link>
        <div className="justify-self-center">
          <FoodTypeToggle />
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <ThemeToggle />
          {token ? (
            <>
              <Link to="/recipes/new" className="btn-primary">
                <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                Add recipe
              </Link>
              <AccountMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
