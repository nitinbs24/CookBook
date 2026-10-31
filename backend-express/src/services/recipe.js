import { Category } from '../models/Category.js';
import { Like } from '../models/Like.js';
import { Recipe } from '../models/Recipe.js';
import { User } from '../models/User.js';
import { httpError } from '../middleware/errorHandler.js';
import { normalizeDish } from '../validators/index.js';

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CARD_PROJECTION = {
  title: 1, dishName: 1, images: { $slice: 1 }, foodType: 1, category: 1,
  avgRating: 1, reviewCount: 1, likeCount: 1, author: 1, createdAt: 1,
};

/** Author names for a batch of recipes in one query (DATABASE_SCHEMA §6.2). */
async function authorNames(recipes) {
  const ids = [...new Set(recipes.map((r) => r.author.toString()))];
  const users = await User.find({ _id: { $in: ids } }, { name: 1 }).lean();
  return new Map(users.map((u) => [u._id.toString(), u.name]));
}

/** Maps lean recipe docs to API cards (TRD §6.2 "Card"). */
async function toCards(recipes) {
  const names = await authorNames(recipes);
  return recipes.map((r) => ({
    id: r._id.toString(),
    title: r.title,
    dishName: r.dishName,
    image: r.images[0],
    foodType: r.foodType,
    category: r.category,
    avgRating: r.avgRating,
    reviewCount: r.reviewCount,
    likeCount: r.likeCount,
    author: { id: r.author.toString(), name: names.get(r.author.toString()) ?? null },
    createdAt: r.createdAt,
  }));
}

function toFull(recipe, authorName) {
  const { _id, author, ...rest } = recipe;
  return { id: _id.toString(), ...rest, author: { id: author.toString(), name: authorName } };
}

async function assertCategoryExists(slug) {
  if (!(await Category.exists({ slug }))) throw httpError(400, 'VALIDATION_ERROR', `category: unknown category "${slug}"`);
}

/**
 * @param {object} input - validated recipeSchema output
 * @param {import('mongoose').Document} user - the author
 * @returns {Promise<object>} the full recipe
 * @throws 400 VALIDATION_ERROR for an unknown category
 */
export async function createRecipe(input, user) {
  await assertCategoryExists(input.category);
  const recipe = await Recipe.create({ ...input, author: user._id });
  return toFull(recipe.toObject(), user.name);
}

/**
 * Replaces an existing recipe's editable fields. Author, counters, and createdAt are kept.
 * @throws 404 NOT_FOUND, 403 FORBIDDEN (not the author), 400 VALIDATION_ERROR (unknown category)
 */
export async function updateRecipe(id, input, user) {
  const recipe = await Recipe.findById(id);
  if (!recipe) throw httpError(404, 'NOT_FOUND', 'Recipe not found');
  if (!recipe.author.equals(user._id)) throw httpError(403, 'FORBIDDEN', 'Only the author can edit this recipe');
  await assertCategoryExists(input.category);
  recipe.set(input);
  await recipe.save();
  return toFull(recipe.toObject(), user.name);
}

/**
 * @param {string} id
 * @param {import('mongoose').Document | null} user - null for guests
 * @returns {Promise<object>} the full recipe plus `likedByMe`
 * @throws 404 NOT_FOUND (unknown or malformed id)
 */
export async function getRecipe(id, user) {
  const recipe = await Recipe.findById(id).lean();
  if (!recipe) throw httpError(404, 'NOT_FOUND', 'Recipe not found');
  const [author, liked] = await Promise.all([
    User.findById(recipe.author, { name: 1 }).lean(),
    user ? Like.exists({ user: user._id, recipe: recipe._id }) : null,
  ]);
  return { ...toFull(recipe, author?.name ?? null), likedByMe: Boolean(liked) };
}

/**
 * Newest first, or by relevance when searching with `q` (text index on title + dishName).
 * @returns {Promise<{ items: object[], page: number, limit: number, total: number }>}
 */
export async function listRecipes({ q, foodType, category, dish, page, limit }) {
  const filter = {};
  // "Both" as $in (not a missing field) lets the {foodType, createdAt} indexes serve the sort via SORT_MERGE.
  filter.foodType = foodType ?? { $in: ['veg', 'nonveg'] };
  if (category) filter.category = category;
  if (dish) filter.dishName = new RegExp(`^${escapeRegex(normalizeDish(dish))}$`, 'i');
  if (q) filter.$text = { $search: q };

  const projection = q ? { ...CARD_PROJECTION, score: { $meta: 'textScore' } } : CARD_PROJECTION;
  const sort = q ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 };
  const [docs, total] = await Promise.all([
    Recipe.find(filter, projection).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Recipe.countDocuments(filter),
  ]);
  return { items: await toCards(docs), page, limit, total };
}

/**
 * Most-liked recipes in the last `days` days (DATABASE_SCHEMA §6.3), as cards with `weekLikes`.
 * @returns {Promise<object[]>}
 */
export async function trendingRecipes({ foodType, days, limit }) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await Like.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: '$recipe', weekLikes: { $sum: 1 } } },
    { $sort: { weekLikes: -1, _id: 1 } },
    // Take 30 before the lookup and `limit` after, so the food-type filter doesn't leave the list short.
    { $limit: 30 },
    { $lookup: { from: 'recipes', localField: '_id', foreignField: '_id', as: 'recipe' } },
    { $unwind: '$recipe' },
    ...(foodType ? [{ $match: { 'recipe.foodType': foodType } }] : []),
    { $limit: limit },
    { $replaceWith: { $mergeObjects: ['$recipe', { weekLikes: '$weekLikes' }] } },
  ]);
  const cards = await toCards(rows);
  return cards.map((card, i) => ({ ...card, weekLikes: rows[i].weekLikes }));
}
