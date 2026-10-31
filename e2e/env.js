export const BACKEND = process.env.BACKEND ?? 'express';
if (!['express', 'fastapi'].includes(BACKEND)) throw new Error('BACKEND must be express or fastapi');

export const API_PORT = BACKEND === 'express' ? 5097 : 8097;
export const WEB_URL = 'http://127.0.0.1:5174';
export const E2E_DB = 'recipebook_e2e';

export const E2E_ENV = {
  MONGODB_URI: `mongodb://localhost:27017/${E2E_DB}`,
  JWT_SECRET: 'e2e-secret-that-is-at-least-32-characters',
  CORS_ORIGIN: WEB_URL,
  CLOUDINARY_FAKE: '1',
  PORT: String(API_PORT),
};
