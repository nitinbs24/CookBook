import { User } from '../models/User.js';
import { httpError } from '../middleware/errorHandler.js';
import { cardPage, textSearch } from './recipe.js';

/** Every user's recipes, newest first (or by relevance with `q`), with `author.email`. */
export function adminRecipes({ q, page, limit }) {
  const filter = {};
  return cardPage(filter, { page, limit }, { ...textSearch(filter, q), withEmail: true });
}

/**
 * Users, newest first, with how many recipes each has (DATABASE_SCHEMA §6.7).
 * @returns {Promise<{ items: object[], page: number, limit: number, total: number }>}
 */
export async function listUsers({ page, limit }) {
  const [rows, total] = await Promise.all([
    User.aggregate([
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      // Count through the {author, createdAt} index instead of loading every recipe.
      { $lookup: { from: 'recipes', localField: '_id', foreignField: 'author', pipeline: [{ $count: 'n' }], as: 'r' } },
    ]),
    User.countDocuments(),
  ]);
  const items = rows.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    recipeCount: u.r[0]?.n ?? 0,
  }));
  return { items, page, limit, total };
}

/**
 * One user's recipes, newest first.
 * @throws 404 NOT_FOUND (unknown user)
 */
export async function userRecipes(userId, { page, limit }) {
  const user = await User.findById(userId, { _id: 1 }).lean();
  if (!user) throw httpError(404, 'NOT_FOUND', 'User not found');
  return cardPage({ author: user._id }, { page, limit }, { withEmail: true });
}
