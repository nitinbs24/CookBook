// shortcut: copy of the 10 categories in db/init-db.js (GET /categories hides empty ones); add an "all" endpoint if categories ever become editable.
export const CATEGORIES = [
  ['paneer', 'Paneer'],
  ['chicken', 'Chicken'],
  ['egg', 'Egg'],
  ['potato', 'Potato'],
  ['mutton', 'Mutton'],
  ['fish-seafood', 'Fish & Seafood'],
  ['dal-lentils', 'Dal & Lentils'],
  ['rice-biryani', 'Rice & Biryani'],
  ['mushroom', 'Mushroom'],
  ['sweets-desserts', 'Sweets & Desserts'],
];

const NAMES = new Map(CATEGORIES);

/** Display name for a category slug ("rice-biryani" → "Rice & Biryani"). */
export const categoryName = (slug) => NAMES.get(slug) ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
