import jwt from 'jsonwebtoken';
import { isValidObjectId } from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { httpError } from './errorHandler.js';

/** The user for a valid Bearer token, or null. The role always comes from the DB, not the token. */
async function userFromToken(req) {
  const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  return isValidObjectId(payload.sub) ? User.findById(payload.sub) : null;
}

/** Sets `req.user`, or responds 401. */
export async function requireAuth(req, _res, next) {
  req.user = await userFromToken(req);
  if (!req.user) throw httpError(401, 'UNAUTHENTICATED', 'Login required');
  next();
}

/** Sets `req.user` to the user or null; a missing or bad token means "guest", never an error. */
export async function optionalAuth(req, _res, next) {
  req.user = await userFromToken(req);
  next();
}
