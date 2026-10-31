import { listCategories } from '../services/category.js';
import { foodTypeQuery } from '../validators/index.js';

export async function list(req, res) {
  res.json(await listCategories(foodTypeQuery.parse(req.query)));
}
