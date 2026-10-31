import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  BACKENDS, MONGO_CONTAINER, TEST_DB, TEST_JWT_SECRET, TEST_MONGODB_URI, apiUrl, backendName,
} from './config.js';

let child;

function initTestDb() {
  try {
    execFileSync('docker', ['exec', MONGO_CONTAINER, 'mongosh', '--quiet', TEST_DB, '/scripts/init-db.js'], {
      stdio: 'pipe',
    });
  } catch (err) {
    throw new Error(
      `Could not run init-db.js in container "${MONGO_CONTAINER}". Is MongoDB up? (docker compose up -d)\n${err.stderr ?? err.message}`,
    );
  }
}

async function waitForApi(url, getExitError) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const exitError = getExitError();
    if (exitError) throw exitError;
    try {
      const res = await fetch(`${url}/categories`);
      if (res.status < 500) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Backend did not answer ${url}/categories within 30 s`);
}

// Vitest 5.0.5 crashes ("code.charCodeAt is not a function") while source-mapping a globalSetup
// error's stack, hiding the message. A plain-string stack skips that lookup.
function readable(err) {
  const e = new Error(err.message);
  e.stack = `Error: ${err.message}`;
  return e;
}

export async function setup() {
  try {
    await start();
  } catch (err) {
    await teardown();
    throw readable(err);
  }
}

async function start() {
  initTestDb();
  if (process.env.API_URL) return; // target an already-running server

  const name = backendName();
  const backend = BACKENDS[name];
  if (!existsSync(backend.cwd)) {
    // Expected before the backend exists: tests then fail on connection errors (honest RED).
    console.warn(`[contract-tests] ${backend.cwd} does not exist yet; not starting a backend.`);
    return;
  }

  let output = '';
  let exitError = null;
  child = spawn(backend.cmd, backend.args, {
    cwd: backend.cwd,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(backend.port),
      MONGODB_URI: TEST_MONGODB_URI,
      JWT_SECRET: TEST_JWT_SECRET,
      CORS_ORIGIN: 'http://localhost:5173',
      CLOUDINARY_FAKE: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });
  child.on('exit', (code) => {
    exitError = new Error(`${name} backend exited early (code ${code}):\n${output}`);
  });

  await waitForApi(apiUrl(), () => exitError);
}

export async function teardown() {
  if (child && child.exitCode === null) child.kill('SIGTERM');
}
