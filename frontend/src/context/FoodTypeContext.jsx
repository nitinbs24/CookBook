import { createContext, useContext, useState } from 'react';

const OPTIONS = ['both', 'veg', 'nonveg'];
const FoodTypeContext = createContext(null);

/** The navbar Veg / Non-veg / Both toggle (PRD F-10), remembered in localStorage. */
export function FoodTypeProvider({ children }) {
  const [foodType, setState] = useState(() => {
    const saved = localStorage.getItem('rb_foodType');
    return OPTIONS.includes(saved) ? saved : 'both';
  });
  const setFoodType = (value) => {
    localStorage.setItem('rb_foodType', value);
    setState(value);
  };
  // "both" means no foodType param at all (TRD §6.1).
  const apiFoodType = foodType === 'both' ? undefined : foodType;
  return <FoodTypeContext value={{ foodType, setFoodType, apiFoodType }}>{children}</FoodTypeContext>;
}

export const useFoodType = () => useContext(FoodTypeContext);
