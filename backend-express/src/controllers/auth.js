import * as authService from '../services/auth.js';
import { loginSchema, registerSchema } from '../validators/index.js';

export async function register(req, res) {
  res.status(201).json(await authService.register(registerSchema.parse(req.body)));
}

export async function login(req, res) {
  res.json(await authService.login(loginSchema.parse(req.body)));
}

export function me(req, res) {
  res.json(req.user);
}
