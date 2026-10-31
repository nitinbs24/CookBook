import { myLikes } from '../services/like.js';
import { myRecipes } from '../services/recipe.js';
import { myListQuery } from '../validators/index.js';

export async function likes(req, res) {
  res.json(await myLikes(req.user._id, myListQuery.parse(req.query)));
}

export async function recipes(req, res) {
  res.json(await myRecipes(req.user, myListQuery.parse(req.query)));
}
