import { Router } from 'express';
import * as auth from '../controllers/auth.js';
import * as categories from '../controllers/categories.js';
import * as recipes from '../controllers/recipes.js';
import * as uploads from '../controllers/uploads.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

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

router.post('/uploads', requireAuth, uploads.imageUpload, uploads.create);
