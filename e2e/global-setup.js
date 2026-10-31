import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { BACKEND, E2E_DB, E2E_ENV } from './env.js';

const SEEDS = {
  express: { cwd: '../backend-express', cmd: 'node', args: ['scripts/seed.js', '--reset'] },
  fastapi: { cwd: '../backend-fastapi', cmd: '.venv/bin/python', args: ['-m', 'scripts.seed', '--reset'] },
};
const installed = (s) => existsSync(new URL(`${s.cwd}/${s.cmd === 'node' ? 'node_modules' : s.cmd}`, import.meta.url));

/**
 * Rebuilds recipebook_e2e: schema and categories, then the demo seed (same data every run).
 * Seeds with the *other* backend's script when it is installed, so every run also proves each
 * backend reads the other's documents (ADR-0001). Both seeds write identical data.
 */
export default function globalSetup() {
  execFileSync('docker', ['exec', 'recipebook-mongo', 'mongosh', '--quiet', E2E_DB, '/scripts/init-db.js'], { stdio: 'pipe' });
  const other = SEEDS[BACKEND === 'express' ? 'fastapi' : 'express'];
  const seed = installed(other) ? other : SEEDS[BACKEND];
  if (seed !== other) console.warn(`[e2e] ${other.cwd} is not set up; seeding with ${BACKEND}'s own script (cross-read not checked).`);
  execFileSync(seed.cmd, seed.args, { cwd: seed.cwd, env: { ...process.env, ...E2E_ENV }, stdio: 'pipe' });
}
