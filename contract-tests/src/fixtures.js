import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { api } from './http.js';
import { testDb } from './db.js';

/** Registers a fresh user through the API. Emails are unique per call. */
export async function registerUser(overrides = {}) {
  const body = {
    name: 'Test Cook',
    email: `cook-${randomUUID()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await api('POST', '/auth/register', { body });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { ...res.body, password: body.password };
}

/** A recipe document valid against the init-db.js validator, for inserting straight into the DB. */
export function recipeDoc(overrides = {}) {
  const now = new Date();
  return {
    title: 'Test Paneer Curry',
    description: null,
    dishName: 'Paneer Curry',
    author: new ObjectId(),
    foodType: 'veg',
    category: 'paneer',
    difficulty: 'easy',
    servings: 2,
    prepTimeMin: 10,
    cookTimeMin: 20,
    images: [{ url: 'https://fake.cloudinary.test/recipebook/a.jpg', publicId: 'recipebook/a' }],
    ingredients: [{ name: 'Paneer', quantity: 200, unit: 'g', note: null }],
    instructions: [{ section: null, steps: [{ text: 'Cook it well.', durationMin: null, tip: null }] }],
    avgRating: 0,
    reviewCount: 0,
    likeCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export async function insertRecipes(docs) {
  const db = await testDb();
  await db.collection('recipes').insertMany(docs);
}

/** Decodes a JWT payload without verifying it (the test only inspects claims). */
export function jwtPayload(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

/** A valid POST /recipes body (no server-set fields). */
export function recipeBody(overrides = {}) {
  return {
    title: 'Dhaba-style Paneer Butter Masala',
    description: 'Smoky, buttery paneer.',
    dishName: 'Paneer Butter Masala',
    foodType: 'veg',
    category: 'paneer',
    difficulty: 'medium',
    servings: 4,
    prepTimeMin: 20,
    cookTimeMin: 35,
    images: [{ url: 'https://fake.cloudinary.test/recipebook/pbm.jpg', publicId: 'recipebook/pbm' }],
    ingredients: [
      { name: 'Paneer', quantity: 250, unit: 'g', note: '1-inch cubes' },
      { name: 'Butter', quantity: 2, unit: 'tbsp' },
    ],
    instructions: [
      { section: 'Gravy', steps: [{ text: 'Cook tomatoes and cashews until soft.', durationMin: 8, tip: 'Do not rush.' }] },
      { steps: [{ text: 'Add paneer and simmer.' }] },
    ],
    ...overrides,
  };
}

/** Registers a user, inserts `docs` as recipes they authored, and returns { user, token, recipes }. */
export async function authorWithRecipes(docs = []) {
  const author = await registerUser();
  const authorId = new ObjectId(author.user.id);
  const recipes = docs.map((d) => recipeDoc({ ...d, author: authorId }));
  if (recipes.length) await insertRecipes(recipes);
  return { ...author, recipes };
}

/** Inserts likes straight into the DB: one per entry, each from a distinct fake user. */
export async function insertLikes(entries) {
  const db = await testDb();
  await db.collection('likes').insertMany(
    entries.map(({ recipe, user = new ObjectId(), createdAt = new Date() }) => ({ user, recipe, createdAt })),
  );
}

export const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
