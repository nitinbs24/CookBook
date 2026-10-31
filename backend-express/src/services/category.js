import { Recipe } from '../models/Recipe.js';

/**
 * Category tiles with recipe counts (DATABASE_SCHEMA §6.1). Categories with no matching
 * recipes produce no group, so they drop out under the veg / non-veg toggle on their own.
 * @param {{ foodType?: 'veg' | 'nonveg' }} foodTypeFilter - {} for Both
 * @returns {Promise<Array<{ slug: string, name: string, imageUrl: string | null, recipeCount: number }>>}
 */
export function listCategories(foodTypeFilter) {
  return Recipe.aggregate([
    { $match: foodTypeFilter },
    { $group: { _id: '$category', recipeCount: { $sum: 1 } } },
    { $lookup: { from: 'categories', localField: '_id', foreignField: 'slug', as: 'c' } },
    { $unwind: '$c' },
    { $sort: { 'c.order': 1 } },
    { $project: { _id: 0, slug: '$c.slug', name: '$c.name', imageUrl: '$c.imageUrl', recipeCount: 1 } },
  ]);
}
