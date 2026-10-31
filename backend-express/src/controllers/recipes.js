import * as recipeService from '../services/recipe.js';
import { listQuery, recipeSchema, trendingQuery } from '../validators/index.js';

export async function list(req, res) {
  res.json(await recipeService.listRecipes(listQuery.parse(req.query)));
}

export async function trending(req, res) {
  res.json(await recipeService.trendingRecipes(trendingQuery.parse(req.query)));
}

export async function get(req, res) {
  res.json(await recipeService.getRecipe(req.params.id, req.user));
}

export async function create(req, res) {
  res.status(201).json(await recipeService.createRecipe(recipeSchema.parse(req.body), req.user));
}

export async function update(req, res) {
  res.json(await recipeService.updateRecipe(req.params.id, recipeSchema.parse(req.body), req.user));
}

export async function remove(req, res) {
  await recipeService.deleteRecipe(req.params.id, req.user);
  res.status(204).end();
}
