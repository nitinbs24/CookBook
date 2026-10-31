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
