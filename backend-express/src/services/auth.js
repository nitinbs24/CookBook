import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { httpError } from '../middleware/errorHandler.js';

const BCRYPT_COST = 12;
// Compared against when the email is unknown, so both failures take the same time.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', BCRYPT_COST);

const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });

/**
 * Creates a user (always role "user") and logs them in.
 * @param {{ name: string, email: string, password: string }} input - already validated
 * @returns {Promise<{ user: import('mongoose').Document, token: string }>}
 * @throws 409 CONFLICT if the email is registered
 */
export async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  try {
    const user = await User.create({ name, email, passwordHash });
    return { user, token: signToken(user) };
  } catch (err) {
    if (err.code === 11000) throw httpError(409, 'CONFLICT', 'Email is already registered');
    throw err;
  }
}

/**
 * @param {{ email: string, password: string }} input - already validated
 * @returns {Promise<{ user: import('mongoose').Document, token: string }>}
 * @throws 401 UNAUTHENTICATED with one generic message for any wrong credential
 */
export async function login({ email, password }) {
  const user = await User.findOne({ email });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw httpError(401, 'UNAUTHENTICATED', 'Email or password is incorrect');
  return { user, token: signToken(user) };
}
