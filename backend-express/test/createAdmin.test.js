import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Runs the real script against the test DB (needs Docker MongoDB, like the contract suite).
const MONGODB_URI = 'mongodb://localhost:27017/recipebook_test';
const run = promisify(execFile);
const createAdmin = (...args) =>
  run('node', ['scripts/createAdmin.js', ...args], {
    env: {
      ...process.env,
      MONGODB_URI,
      JWT_SECRET: 'unit-test-secret-at-least-32-characters',
      CORS_ORIGIN: 'http://localhost:5173',
    },
  });

let users;
const email = () => `admin-${randomUUID()}@example.com`;

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
  users = mongoose.connection.collection('users');
});
afterAll(async () => {
  await users.deleteMany({ email: /^admin-.*@example\.com$/ });
  await mongoose.disconnect();
});

describe('create-admin script', () => {
  it('creates a new admin with a lowercased email and a bcrypt hash of the password', async () => {
    const address = email();

    const { stdout } = await createAdmin(address.toUpperCase(), 'password123', 'Root Admin');

    const user = await users.findOne({ email: address });
    expect(stdout).toContain(`Created admin ${address}`);
    expect(user).toMatchObject({ name: 'Root Admin', role: 'admin' });
    expect(await bcrypt.compare('password123', user.passwordHash)).toBe(true);
  });

  it('promotes an existing user to admin and leaves their password unchanged', async () => {
    const address = email();
    const passwordHash = await bcrypt.hash('original-pass', 4);
    await users.insertOne({ name: 'Cook', email: address, passwordHash, role: 'user', createdAt: new Date() });

    const { stdout } = await createAdmin(address, 'different-pass');

    const user = await users.findOne({ email: address });
    expect(stdout).toContain('(password unchanged)');
    expect(user.role).toBe('admin');
    expect(user.passwordHash).toBe(passwordHash);
  });

  it('exits with code 1 and writes nothing for invalid input', async () => {
    const before = await users.countDocuments();

    const result = createAdmin('not-an-email', 'short');

    await expect(result).rejects.toMatchObject({ code: 1 });
    expect(await users.countDocuments()).toBe(before);
  });
});
