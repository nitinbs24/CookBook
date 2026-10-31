import { execFileSync } from 'node:child_process';
import { E2E_DB, E2E_ENV } from './env.js';

/** Rebuilds recipebook_e2e: schema and categories, then the demo seed (same data every run). */
export default function globalSetup() {
  execFileSync('docker', ['exec', 'recipebook-mongo', 'mongosh', '--quiet', E2E_DB, '/scripts/init-db.js'], { stdio: 'pipe' });
  execFileSync('node', ['scripts/seed.js', '--reset'], {
    cwd: '../backend-express',
    env: { ...process.env, ...E2E_ENV },
    stdio: 'pipe',
  });
}
