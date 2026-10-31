import * as adminService from '../services/admin.js';
import { adminRecipesQuery, pageQuery } from '../validators/index.js';

export async function recipes(req, res) {
  res.json(await adminService.adminRecipes(adminRecipesQuery.parse(req.query)));
}

export async function users(req, res) {
  res.json(await adminService.listUsers(pageQuery.parse(req.query)));
}

export async function userRecipes(req, res) {
  res.json(await adminService.userRecipes(req.params.id, pageQuery.parse(req.query)));
}
