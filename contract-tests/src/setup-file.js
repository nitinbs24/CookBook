import { afterAll, beforeAll } from 'vitest';
import { closeDb, resetDb } from './db.js';

// Runs once per test file: each file starts from an empty database (categories kept).
beforeAll(resetDb);
afterAll(closeDb);
