// The recipe form keeps every input as a string; these convert to and from the API shape (TRD §9).

export const emptyIngredient = () => ({ name: '', quantity: '', unit: '', note: '' });
export const emptyStep = () => ({ text: '', durationMin: '', tip: '' });
export const emptySection = () => ({ section: '', steps: [emptyStep()] });

export const emptyRecipe = () => ({
  title: '',
  description: '',
  dishName: '',
  category: '',
  foodType: 'veg',
  difficulty: 'easy',
  servings: '',
  prepTimeMin: '',
  cookTimeMin: '',
  images: [],
  ingredients: [emptyIngredient()],
  instructions: [emptySection()],
});

const str = (v) => (v == null ? '' : String(v));

/** API recipe → form state. */
export function fromRecipe(r) {
  return {
    title: r.title,
    description: str(r.description),
    dishName: r.dishName,
    category: r.category,
    foodType: r.foodType,
    difficulty: r.difficulty,
    servings: str(r.servings),
    prepTimeMin: str(r.prepTimeMin),
    cookTimeMin: str(r.cookTimeMin),
    images: r.images,
    ingredients: r.ingredients.map((i) => ({ name: i.name, quantity: str(i.quantity), unit: str(i.unit), note: str(i.note) })),
    instructions: r.instructions.map((s) => ({
      section: str(s.section),
      steps: s.steps.map((st) => ({ text: st.text, durationMin: str(st.durationMin), tip: str(st.tip) })),
    })),
  };
}

const text = (v) => v.trim() || null;
const num = (v) => (v.trim() === '' ? null : Number(v));

/** Form state → POST/PUT /recipes body. Blank optional fields become null. */
export function toBody(f) {
  return {
    title: f.title.trim(),
    description: text(f.description),
    dishName: f.dishName.trim(),
    category: f.category,
    foodType: f.foodType,
    difficulty: f.difficulty,
    servings: Number(f.servings),
    prepTimeMin: Number(f.prepTimeMin),
    cookTimeMin: Number(f.cookTimeMin),
    images: f.images,
    ingredients: f.ingredients.map((i) => ({ name: i.name.trim(), quantity: num(i.quantity), unit: text(i.unit), note: text(i.note) })),
    instructions: f.instructions.map((s) => ({
      section: text(s.section),
      steps: s.steps.map((st) => ({ text: st.text.trim(), durationMin: num(st.durationMin), tip: text(st.tip) })),
    })),
  };
}

const lengthOk = (v, min, max) => v.trim().length >= min && v.trim().length <= max;
const intOk = (v, min, max) => /^\d+$/.test(v.trim()) && Number(v) >= min && Number(v) <= max;
const optional = (v, check) => v.trim() === '' || check(v);

/**
 * Client copy of the API rules (TRD §9). Keys are field paths ("ingredients.0.name"),
 * the same paths the API puts in its VALIDATION_ERROR messages.
 */
export function recipeErrors(f) {
  const e = {};
  if (!f.images.length) e.images = 'Add at least one photo';
  if (!lengthOk(f.title, 3, 120)) e.title = 'Title must be 3–120 characters';
  if (f.description.trim().length > 500) e.description = 'Keep the description under 500 characters';
  if (!lengthOk(f.dishName.replace(/\s+/g, ' '), 2, 80)) e.dishName = 'Dish name must be 2–80 characters';
  if (!f.category) e.category = 'Choose a category';
  if (!intOk(f.servings, 1, 50)) e.servings = 'Servings must be a whole number from 1 to 50';
  if (!intOk(f.prepTimeMin, 0, 1440)) e.prepTimeMin = 'Enter whole minutes, 0–1440';
  if (!intOk(f.cookTimeMin, 0, 1440)) e.cookTimeMin = 'Enter whole minutes, 0–1440';
  f.ingredients.forEach((ing, i) => {
    const p = `ingredients.${i}`;
    if (!lengthOk(ing.name, 1, 60)) e[`${p}.name`] = 'Name is required (up to 60 characters)';
    if (!optional(ing.quantity, (v) => Number.isFinite(Number(v)) && Number(v) >= 0)) e[`${p}.quantity`] = 'Quantity must be 0 or more';
    if (ing.unit.trim().length > 20) e[`${p}.unit`] = 'Up to 20 characters';
    if (ing.note.trim().length > 60) e[`${p}.note`] = 'Up to 60 characters';
  });
  f.instructions.forEach((sec, s) => {
    if (sec.section.trim().length > 40) e[`instructions.${s}.section`] = 'Up to 40 characters';
    sec.steps.forEach((st, i) => {
      const p = `instructions.${s}.steps.${i}`;
      if (!lengthOk(st.text, 3, 600)) e[`${p}.text`] = 'Describe the step in 3–600 characters';
      if (!optional(st.durationMin, (v) => intOk(v, 0, 1440))) e[`${p}.durationMin`] = 'Whole minutes, 0–1440';
      if (st.tip.trim().length > 200) e[`${p}.tip`] = 'Up to 200 characters';
    });
  });
  return e;
}
