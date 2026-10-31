import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Needs Docker MongoDB (like createAdmin.test.js). Env is set before importing the service.
const MONGODB_URI = 'mongodb://localhost:27017/recipebook_test';
Object.assign(process.env, { MONGODB_URI, JWT_SECRET: 'unit-test-secret-at-least-32-characters', CORS_ORIGIN: 'http://x' });
const { unusedPublicIds } = await import('../src/services/recipe.js');

const marker = `cleanup-${Date.now()}`;
let recipes;

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
  recipes = mongoose.connection.collection('recipes');
});
afterAll(async () => {
  await recipes.deleteMany({ title: marker });
  await mongoose.disconnect();
});

describe('unusedPublicIds', () => {
  it('returns only the ids that no remaining recipe references', async () => {
    const now = new Date();
    await recipes.insertOne({
      title: marker, dishName: 'Shared Dish', author: new mongoose.Types.ObjectId(), foodType: 'veg', category: 'paneer',
      difficulty: 'easy', servings: 1, prepTimeMin: 1, cookTimeMin: 1,
      images: [{ url: 'https://x.test/shared.jpg', publicId: `recipebook/${marker}-shared` }],
      ingredients: [{ name: 'Paneer' }], instructions: [{ steps: [{ text: 'Cook it.' }] }],
      avgRating: 0, reviewCount: 0, likeCount: 0, createdAt: now, updatedAt: now,
    });

    const result = await unusedPublicIds([`recipebook/${marker}-shared`, `recipebook/${marker}-mine`]);

    expect(result).toEqual([`recipebook/${marker}-mine`]);
  });

  it('returns an empty list for no ids', async () => {
    expect(await unusedPublicIds([])).toEqual([]);
  });
});
