import { Recipe } from '../models/Recipe.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { httpError } from '../middleware/errorHandler.js';

const toReview = (r, name) => ({
  id: r._id.toString(),
  rating: r.rating,
  comment: r.comment,
  user: { id: r.user.toString(), name },
  createdAt: r.createdAt,
});

/**
 * Recomputes a recipe's avgRating (1 decimal) and reviewCount from its reviews (DATABASE_SCHEMA §6.4).
 * Also used by the seed script.
 * @param {import('mongoose').Types.ObjectId} recipeId
 */
export async function recomputeRating(recipeId) {
  const [s] = await Review.aggregate([
    { $match: { recipe: recipeId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  await Recipe.updateOne(
    { _id: recipeId },
    { $set: { avgRating: s ? Math.round(s.avg * 10) / 10 : 0, reviewCount: s ? s.n : 0 } },
  );
}

async function findRecipe(id) {
  const recipe = await Recipe.findById(id, { author: 1 }).lean();
  if (!recipe) throw httpError(404, 'NOT_FOUND', 'Recipe not found');
  return recipe;
}

/**
 * A page of a recipe's reviews, newest first.
 * @throws 404 NOT_FOUND
 */
export async function listReviews(recipeId, { page, limit }) {
  const recipe = await findRecipe(recipeId);
  const filter = { recipe: recipe._id };
  const [docs, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Review.countDocuments(filter),
  ]);
  const users = await User.find({ _id: { $in: docs.map((d) => d.user) } }, { name: 1 }).lean();
  const names = new Map(users.map((u) => [u._id.toString(), u.name]));
  return { items: docs.map((d) => toReview(d, names.get(d.user.toString()) ?? null)), page, limit, total };
}

/**
 * @param {{ rating: number, comment: string | null }} input - validated
 * @throws 404 NOT_FOUND, 403 FORBIDDEN (own recipe), 409 CONFLICT (already reviewed)
 */
export async function createReview(recipeId, input, user) {
  const recipe = await findRecipe(recipeId);
  if (recipe.author.equals(user._id)) throw httpError(403, 'FORBIDDEN', 'You cannot review your own recipe');
  let review;
  try {
    review = await Review.create({ ...input, recipe: recipe._id, user: user._id });
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'CONFLICT', 'You already reviewed this recipe');
    throw err;
  }
  await recomputeRating(recipe._id);
  return toReview(review, user.name);
}

/**
 * Deletes a review (reviewer or admin) and recomputes the recipe's rating.
 * @throws 404 NOT_FOUND, 403 FORBIDDEN
 */
export async function deleteReview(id, user) {
  const review = await Review.findById(id).lean();
  if (!review) throw httpError(404, 'NOT_FOUND', 'Review not found');
  if (!review.user.equals(user._id) && user.role !== 'admin') {
    throw httpError(403, 'FORBIDDEN', 'Only the reviewer or an admin can delete this review');
  }
  await Review.deleteOne({ _id: review._id });
  await recomputeRating(review.recipe);
}
