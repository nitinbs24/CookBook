import { defineConfig } from '@playwright/test';
import { API_PORT, BACKEND, E2E_ENV, WEB_URL } from './env.js';

// Playwright starts the chosen backend (BACKEND=express|fastapi) and Vite on their own ports,
// against the recipebook_e2e database that global-setup rebuilds before every run.
const backends = {
  express: { command: 'node src/server.js', cwd: '../backend-express' },
  fastapi: { command: `.venv/bin/uvicorn app.main:app --port ${API_PORT}`, cwd: '../backend-fastapi' },
};

export default defineConfig({
  testDir: './tests',
  workers: 1, // the specs share one database
  globalSetup: './global-setup.js',
  reporter: [['list']],
  use: { baseURL: WEB_URL, viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure' },
  webServer: [
    { ...backends[BACKEND], url: `http://127.0.0.1:${API_PORT}/api/v1/categories`, env: E2E_ENV, timeout: 60_000 },
    {
      command: 'npx vite --mode express --port 5174 --strictPort',
      cwd: '../frontend',
      url: WEB_URL,
      env: { VITE_API_URL: `http://127.0.0.1:${API_PORT}/api/v1` }, // overrides .env.express
      timeout: 60_000,
    },
  ],
});
