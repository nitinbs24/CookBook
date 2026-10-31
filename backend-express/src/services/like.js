import { Like } from '../models/Like.js';
import { Recipe } from '../models/Recipe.js';
import { httpError } from '../middleware/errorHandler.js';
import { toCards } from './recipe.js';

async function likeCountOf(recipeId) {
  const recipe = await Recipe.findById(recipeId, { likeCount: 1 }).lean();
  if (!recipe) throw httpError(404, 'NOT_FOUND', 'Recipe not found');
  return recipe.likeCount;
}

/**
 * Likes a recipe (DATABASE_SCHEMA §6.5). Idempotent: the unique {user, recipe} index turns a
 * second like into a duplicate-key error, and the counter only moves after a real insert.
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} recipeId
 * @returns {Promise<{ liked: true, likeCount: number }>}
 * @throws 404 NOT_FOUND
 */
export async function like(userId, recipeId) {
  await likeCountOf(recipeId);
  try {
    const { recipe } = await Like.create({ user: userId, recipe: recipeId });
    await Recipe.updateOne({ _id: recipe }, { $inc: { likeCount: 1 } });
  } catch (err) {
    if (err.code !== 11000) throw err; // already liked
  }
  return { liked: true, likeCount: await likeCountOf(recipeId) };
}

/**
 * Unlikes a recipe; the counter only moves if a like was actually removed.
 * @returns {Promise<{ liked: false, likeCount: number }>}
 * @throws 404 NOT_FOUND
 */
export async function unlike(userId, recipeId) {
  await likeCountOf(recipeId);
  const { deletedCount } = await Like.deleteOne({ user: userId, recipe: recipeId });
  if (deletedCount === 1) await Recipe.updateOne({ _id: recipeId }, { $inc: { likeCount: -1 } });
  return { liked: false, likeCount: await likeCountOf(recipeId) };
}

/**
 * "Want to try": the user's liked recipes, most recently liked first (DATABASE_SCHEMA §6.6).
 * @returns {Promise<{ items: object[], page: number, limit: number, total: number }>}
 */
export async function myLikes(userId, { foodType, page, limit }) {
  const [result] = await Like.aggregate([
    { $match: { user: userId } },
    { $sort: { createdAt: -1 } },
    { $lookup: { from: 'recipes', localField: 'recipe', foreignField: '_id', as: 'r' } },
    { $unwind: '$r' },
    ...(foodType ? [{ $match: { 'r.foodType': foodType } }] : []),
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $replaceWith: '$r' }],
        total: [{ $count: 'n' }],
      },
    },
  ]);
  return { items: await toCards(result.items), page, limit, total: result.total[0]?.n ?? 0 };
}
