import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const MONGO_CONTAINER = 'recipebook-mongo';
export const TEST_DB = 'recipebook_test';
export const TEST_MONGODB_URI = `mongodb://localhost:27017/${TEST_DB}`;
export const TEST_JWT_SECRET = 'contract-test-secret-at-least-32-characters-long';

// Test ports differ from the dev ports (5000 / 8000), so a running dev server doesn't clash.
export const BACKENDS = {
  express: {
    cwd: path.join(repoRoot, 'backend-express'),
    cmd: 'node',
    args: ['src/server.js'],
    port: 5099,
  },
  fastapi: {
    cwd: path.join(repoRoot, 'backend-fastapi'),
    cmd: path.join(repoRoot, 'backend-fastapi/.venv/bin/uvicorn'),
    args: ['app.main:app', '--port', '8099'],
    port: 8099,
  },
};

export function backendName() {
  const name = process.env.BACKEND ?? 'express';
  if (!BACKENDS[name]) throw new Error(`BACKEND must be one of: ${Object.keys(BACKENDS).join(', ')}`);
  return name;
}

/** Base URL of the API under test: `API_URL` if set, else the spawned backend's test port. */
export function apiUrl() {
  return process.env.API_URL ?? `http://localhost:${BACKENDS[backendName()].port}/api/v1`;
}
