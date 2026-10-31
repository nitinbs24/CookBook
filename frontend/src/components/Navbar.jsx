import { Monitor, Moon, Sun } from 'lucide-react';
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

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
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
              <span className="px-2 text-sm text-muted">{user?.name}</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Log out
              </button>
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
