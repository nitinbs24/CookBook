import { Router } from 'express';
import * as admin from '../controllers/admin.js';
import * as auth from '../controllers/auth.js';
import * as categories from '../controllers/categories.js';
import * as likes from '../controllers/likes.js';
import * as me from '../controllers/me.js';
import * as recipes from '../controllers/recipes.js';
import * as reviews from '../controllers/reviews.js';
import * as uploads from '../controllers/uploads.js';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.js';

export const router = Router();

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);

router.get('/categories', categories.list);

router.get('/recipes', recipes.list);
router.get('/recipes/trending', recipes.trending); // before /recipes/:id, or "trending" is read as an id
router.get('/recipes/:id', optionalAuth, recipes.get);
router.post('/recipes', requireAuth, recipes.create);
router.put('/recipes/:id', requireAuth, recipes.update);
router.delete('/recipes/:id', requireAuth, recipes.remove);

router.post('/recipes/:id/like', requireAuth, likes.like);
router.delete('/recipes/:id/like', requireAuth, likes.unlike);

router.get('/recipes/:id/reviews', reviews.list);
router.post('/recipes/:id/reviews', requireAuth, reviews.create);
router.delete('/reviews/:id', requireAuth, reviews.remove);

router.get('/me/likes', requireAuth, me.likes);
router.get('/me/recipes', requireAuth, me.recipes);

router.post('/uploads', requireAuth, uploads.imageUpload, uploads.create);

router.use('/admin', requireAuth, requireAdmin);
router.get('/admin/recipes', admin.recipes);
router.get('/admin/users', admin.users);
router.get('/admin/users/:id/recipes', admin.userRecipes);
