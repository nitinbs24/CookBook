import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { httpError } from './errorHandler.js';

/** Sets `req.user` from a valid Bearer token. The role always comes from the DB, not the token. */
export async function requireAuth(req, _res, next) {
  const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw httpError(401, 'UNAUTHENTICATED', 'Login required');
  }
  const user = isValidObjectId(payload.sub) ? await User.findById(payload.sub) : null;
  if (!user) throw httpError(401, 'UNAUTHENTICATED', 'Login required');
  req.user = user;
  next();
}
