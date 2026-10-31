import { fileURLToPath } from 'node:url';

// One .env at the repo root serves both backends. Variables already set (e.g. by the
// contract-test harness) win over the file.
try {
  process.loadEnvFile(fileURLToPath(new URL('../../../.env', import.meta.url)));
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

for (const name of ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGIN']) {
  if (!process.env[name]) throw new Error(`Missing env var ${name} (see .env.example)`);
}
if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  PORT: Number(process.env.PORT ?? 5000),
  CLOUDINARY_FAKE: process.env.CLOUDINARY_FAKE === '1',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
