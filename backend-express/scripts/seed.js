// Usage: npm run seed            (refuses if the DB already has users or recipes)
//        npm run seed -- --reset (deletes users, recipes, reviews, likes first; categories are kept)
// Demo data: 6 users (1 admin), 30 recipes, ~100 likes over 14 days, ~50 reviews.
// Counters are set through the same helpers the API uses.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { Like } from '../src/models/Like.js';
import { Recipe } from '../src/models/Recipe.js';
import { Review } from '../src/models/Review.js';
import { User } from '../src/models/User.js';
import { like } from '../src/services/like.js';
import { recomputeRating } from '../src/services/review.js';

const PASSWORD = 'password123';
const DAY = 24 * 60 * 60 * 1000;

// Deterministic pseudo-random numbers, so every seed run produces the same data.
let state = 42;
const rand = () => ((state = (state * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (list) => list[Math.floor(rand() * list.length)];

const USERS = [
  ['Site Admin', 'admin@recipebook.test', 'admin'],
  ['Asha Rao', 'asha@recipebook.test'],
  ['Ravi Kumar', 'ravi@recipebook.test'],
  ['Meera Iyer', 'meera@recipebook.test'],
  ['Kabir Singh', 'kabir@recipebook.test'],
  ['Fatima Sheikh', 'fatima@recipebook.test'],
];

// [title, dishName, category, foodType, difficulty, prepMin, cookMin, servings]
const RECIPES = [
  ['Dhaba-style Paneer Butter Masala', 'Paneer Butter Masala', 'paneer', 'veg', 'medium', 20, 35, 4],
  ['Restaurant Paneer Butter Masala', 'Paneer Butter Masala', 'paneer', 'veg', 'medium', 25, 40, 4],
  ['Quick Weeknight Paneer Butter Masala', 'Paneer Butter Masala', 'paneer', 'veg', 'easy', 10, 20, 3],
  ['Smoky Paneer Tikka', 'Paneer Tikka', 'paneer', 'veg', 'medium', 40, 15, 4],
  ['Palak Paneer', 'Palak Paneer', 'paneer', 'veg', 'easy', 15, 25, 4],
  ['Old Delhi Butter Chicken', 'Butter Chicken', 'chicken', 'nonveg', 'hard', 60, 45, 4],
  ['Home-style Butter Chicken', 'Butter Chicken', 'chicken', 'nonveg', 'medium', 30, 35, 4],
  ['Chettinad Chicken Curry', 'Chicken Chettinad', 'chicken', 'nonveg', 'medium', 20, 40, 4],
  ['Crispy Chicken 65', 'Chicken 65', 'chicken', 'nonveg', 'medium', 30, 20, 3],
  ['Dhaba Egg Curry', 'Egg Curry', 'egg', 'nonveg', 'easy', 10, 25, 3],
  ['Kerala Egg Roast', 'Egg Curry', 'egg', 'nonveg', 'medium', 15, 30, 3],
  ['Masala Omelette', 'Masala Omelette', 'egg', 'nonveg', 'easy', 5, 5, 1],
  ['Aloo Gobi', 'Aloo Gobi', 'potato', 'veg', 'easy', 15, 25, 4],
  ['Kashmiri Dum Aloo', 'Dum Aloo', 'potato', 'veg', 'medium', 20, 40, 4],
  ['Punjabi Aloo Paratha', 'Aloo Paratha', 'potato', 'veg', 'medium', 30, 20, 4],
  ['Mutton Rogan Josh', 'Rogan Josh', 'mutton', 'nonveg', 'hard', 30, 90, 5],
  ['Mutton Keema Matar', 'Keema', 'mutton', 'nonveg', 'medium', 15, 40, 4],
  ['Goan Fish Curry', 'Fish Curry', 'fish-seafood', 'nonveg', 'medium', 20, 25, 4],
  ['Prawn Masala', 'Prawn Masala', 'fish-seafood', 'nonveg', 'medium', 20, 20, 3],
  ['Amritsari Fish Fry', 'Fish Fry', 'fish-seafood', 'nonveg', 'easy', 30, 15, 3],
  ['Everyday Dal Tadka', 'Dal Tadka', 'dal-lentils', 'veg', 'easy', 10, 30, 4],
  ['Dhaba Dal Tadka', 'Dal Tadka', 'dal-lentils', 'veg', 'easy', 15, 35, 4],
  ['Slow-cooked Dal Makhani', 'Dal Makhani', 'dal-lentils', 'veg', 'hard', 480, 120, 6],
  ['Hyderabadi Chicken Biryani', 'Chicken Biryani', 'rice-biryani', 'nonveg', 'hard', 60, 60, 6],
  ['Kolkata Chicken Biryani', 'Chicken Biryani', 'rice-biryani', 'nonveg', 'hard', 60, 75, 6],
  ['Simple Veg Pulao', 'Veg Pulao', 'rice-biryani', 'veg', 'easy', 15, 25, 4],
  ['Mushroom Masala', 'Mushroom Masala', 'mushroom', 'veg', 'easy', 10, 20, 3],
  ['Mushroom Do Pyaza', 'Mushroom Do Pyaza', 'mushroom', 'veg', 'medium', 15, 25, 3],
  ['Soft Gulab Jamun', 'Gulab Jamun', 'sweets-desserts', 'veg', 'medium', 20, 30, 6],
  ['Winter Gajar Ka Halwa', 'Gajar Halwa', 'sweets-desserts', 'veg', 'medium', 20, 60, 6],
];

const MAIN = {
  paneer: ['Paneer', 250, 'g'], chicken: ['Chicken', 500, 'g'], egg: ['Eggs', 4, 'pcs'], potato: ['Potatoes', 4, 'pcs'],
  mutton: ['Mutton', 500, 'g'], 'fish-seafood': ['Fish or prawns', 400, 'g'], 'dal-lentils': ['Lentils', 1, 'cup'],
  'rice-biryani': ['Basmati rice', 2, 'cups'], mushroom: ['Mushrooms', 300, 'g'], 'sweets-desserts': ['Milk', 1, 'litre'],
};

function recipeContent([title, , category]) {
  const [main, quantity, unit] = MAIN[category];
  if (category === 'sweets-desserts') {
    return {
      ingredients: [
        { name: main, quantity, unit, note: 'full fat' },
        { name: 'Sugar', quantity: 1, unit: 'cup', note: null },
        { name: 'Ghee', quantity: 3, unit: 'tbsp', note: null },
        { name: 'Cardamom', quantity: 4, unit: 'pods', note: 'crushed' },
      ],
      instructions: [
        { section: 'Base', steps: [{ text: `Simmer the ${main.toLowerCase()} until it thickens, stirring often.`, durationMin: 30, tip: 'Use a heavy pan so it does not catch.' }] },
        { section: 'Finish', steps: [
          { text: 'Add sugar, ghee, and cardamom, then cook until glossy.', durationMin: 10, tip: null },
          { text: `Serve ${title} warm or chilled.`, durationMin: null, tip: null },
        ] },
      ],
    };
  }
  return {
    ingredients: [
      { name: main, quantity, unit, note: null },
      { name: 'Onions', quantity: 2, unit: 'pcs', note: 'finely chopped' },
      { name: 'Tomatoes', quantity: 3, unit: 'pcs', note: 'pureed' },
      { name: 'Ginger-garlic paste', quantity: 1, unit: 'tbsp', note: null },
      { name: 'Garam masala', quantity: 1, unit: 'tsp', note: null },
      { name: 'Oil', quantity: 2, unit: 'tbsp', note: null },
      { name: 'Salt', quantity: null, unit: null, note: 'to taste' },
    ],
    instructions: [
      { section: 'Prep', steps: [{ text: `Clean and cut the ${main.toLowerCase()}; chop the onions and puree the tomatoes.`, durationMin: 10, tip: null }] },
      { section: 'Cook', steps: [
        { text: 'Heat oil, fry the onions until golden, then add the ginger-garlic paste.', durationMin: 8, tip: 'Golden, not brown: burnt onions turn the gravy bitter.' },
        { text: 'Add the tomato puree and spices; cook until the oil separates.', durationMin: 10, tip: null },
        { text: `Add the ${main.toLowerCase()}, cover, and simmer until done. Finish with garam masala.`, durationMin: 15, tip: null },
      ] },
    ],
  };
}

const COMMENTS = [
  'Turned out perfect, the family loved it.', 'Great balance of spices.', 'Easy to follow, will make again.',
  'A bit spicy for us, but delicious.', 'Better than the restaurant version!', null, null,
];

const reset = process.argv.includes('--reset');
await connectDb();
console.log(`Seeding database "${mongoose.connection.name}"${reset ? ' (reset)' : ''}`);
if (!reset && ((await User.estimatedDocumentCount()) || (await Recipe.estimatedDocumentCount()))) {
  console.error('Database already has users or recipes. Run `npm run seed -- --reset` to replace them.');
  await mongoose.disconnect();
  process.exit(1);
}
if (reset) await Promise.all([User, Recipe, Review, Like].map((M) => M.deleteMany({})));

const passwordHash = await bcrypt.hash(PASSWORD, 12);
const users = await User.create(USERS.map(([name, email, role = 'user']) => ({ name, email, passwordHash, role })));
const cooks = users.slice(1);

const now = Date.now();
const recipes = await Recipe.create(
  RECIPES.map((row, i) => {
    const [title, dishName, category, foodType, difficulty, prepTimeMin, cookTimeMin, servings] = row;
    const createdAt = new Date(now - (30 - i) * DAY);
    return {
      title, dishName, category, foodType, difficulty, prepTimeMin, cookTimeMin, servings,
      description: `${title}: a ${difficulty} ${foodType === 'veg' ? 'vegetarian' : 'non-vegetarian'} favourite.`,
      author: cooks[i % cooks.length]._id,
      images: [{ url: `https://picsum.photos/seed/recipebook-${i + 1}/800/600`, publicId: `recipebook/seed-${i + 1}` }],
      ...recipeContent(row),
      createdAt,
      updatedAt: createdAt,
    };
  }),
);

// Likes: unique (user, recipe) pairs, dated over the last 14 days.
const liked = new Set();
while (liked.size < 100) {
  const user = pick(users);
  const recipe = pick(recipes);
  const key = `${user._id}:${recipe._id}`;
  if (liked.has(key)) continue;
  liked.add(key);
  await like(user._id, recipe._id.toString());
  await Like.updateOne({ user: user._id, recipe: recipe._id }, { $set: { createdAt: new Date(now - rand() * 14 * DAY) } });
}

// Reviews: unique (user, recipe), never on your own recipe, mostly 3–5 stars.
const reviewed = new Set();
while (reviewed.size < 50) {
  const user = pick(users);
  const recipe = pick(recipes);
  const key = `${user._id}:${recipe._id}`;
  if (reviewed.has(key) || recipe.author.equals(user._id)) continue;
  reviewed.add(key);
  const review = await Review.create({ recipe: recipe._id, user: user._id, rating: pick([3, 4, 4, 5, 5, 5, 2]), comment: pick(COMMENTS) });
  await Review.updateOne({ _id: review._id }, { $set: { createdAt: new Date(now - rand() * 14 * DAY) } });
}
for (const recipe of recipes) await recomputeRating(recipe._id);

console.log(`Seeded ${users.length} users, ${recipes.length} recipes, ${liked.size} likes, ${reviewed.size} reviews.`);
console.log(`Log in as admin@recipebook.test or asha@recipebook.test (and others) with password "${PASSWORD}".`);
await mongoose.disconnect();
