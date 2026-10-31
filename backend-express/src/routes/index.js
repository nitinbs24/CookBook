import { Router } from 'express';
import * as auth from '../controllers/auth.js';
import * as categories from '../controllers/categories.js';
import { requireAuth } from '../middleware/auth.js';

export const router = Router();

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', requireAuth, auth.me);

router.get('/categories', categories.list);
