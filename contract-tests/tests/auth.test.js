import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { api } from '../src/http.js';
import { testDb } from '../src/db.js';
import { jwtPayload, registerUser } from '../src/fixtures.js';

const USER_KEYS = ['createdAt', 'email', 'id', 'name', 'role'];

describe('POST /auth/register', () => {
  it('creates a user and returns 201 with the public user and a token', async () => {
    const res = await api('POST', '/auth/register', {
      body: { name: 'Asha', email: 'Asha.Reg@Example.com', password: 'password123' },
    });

    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(['token', 'user']);
    expect(Object.keys(res.body.user).sort()).toEqual(USER_KEYS);
    expect(res.body.user).toMatchObject({ name: 'Asha', email: 'asha.reg@example.com', role: 'user' });
    expect(res.body.user.id).toMatch(/^[0-9a-f]{24}$/);
    expect(new Date(res.body.user.createdAt).toISOString()).toBe(res.body.user.createdAt);
  });

  it('always creates role "user", even if the body asks for admin', async () => {
    const { user } = await registerUser({ role: 'admin' });

    expect(user.role).toBe('user');
  });

  it('stores a bcrypt hash with cost 12, never the plain password', async () => {
    const { user } = await registerUser({ password: 'secret-pass-1' });
    const db = await testDb();

    const stored = await db.collection('users').findOne({ _id: new ObjectId(user.id) });

    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(JSON.stringify(stored)).not.toContain('secret-pass-1');
  });

  it('returns a 7-day HS256 token whose payload is { sub: userId, role }', async () => {
    const { user, token } = await registerUser();

    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    const payload = jwtPayload(token);

    expect(header.alg).toBe('HS256');
    expect(payload).toMatchObject({ sub: user.id, role: 'user' });
    expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
  });

  it('returns 409 CONFLICT for an email that is already registered (case-insensitive)', async () => {
    await registerUser({ email: 'dupe@example.com' });

    const res = await api('POST', '/auth/register', {
      body: { name: 'Other', email: 'DUPE@example.com', password: 'password123' },
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it.each([
    ['a short password', { name: 'Asha', email: 'a@example.com', password: 'short' }],
    ['a password over 72 chars', { name: 'Asha', email: 'a@example.com', password: 'x'.repeat(73) }],
    ['an invalid email', { name: 'Asha', email: 'not-an-email', password: 'password123' }],
    ['a 1-char name', { name: 'A', email: 'a@example.com', password: 'password123' }],
    ['a missing name', { email: 'a@example.com', password: 'password123' }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, body) => {
    const res = await api('POST', '/auth/register', { body });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'VALIDATION_ERROR', message: expect.any(String) } });
  });
});

describe('POST /auth/login', () => {
  it('returns 200 with the user and a token for correct credentials', async () => {
    const { user, password } = await registerUser();

    const res = await api('POST', '/auth/login', { body: { email: user.email.toUpperCase(), password } });

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual(user);
    expect(jwtPayload(res.body.token).sub).toBe(user.id);
  });

  it('returns the same 401 UNAUTHENTICATED for a wrong password and an unknown email', async () => {
    const { user } = await registerUser();

    const wrongPassword = await api('POST', '/auth/login', { body: { email: user.email, password: 'wrong-password' } });
    const unknownEmail = await api('POST', '/auth/login', { body: { email: 'nobody@example.com', password: 'wrong-password' } });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('UNAUTHENTICATED');
    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it('rejects a NoSQL-injection object as the email with 400', async () => {
    const res = await api('POST', '/auth/login', { body: { email: { $gt: '' }, password: 'anything1' } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /auth/me', () => {
  it('returns 200 with the current user for a valid token', async () => {
    const { user, token } = await registerUser();

    const res = await api('GET', '/auth/me', { token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(user);
  });

  it('uses the role from the database, not the token', async () => {
    const { user, token } = await registerUser();
    const db = await testDb();
    await db.collection('users').updateOne({ _id: new ObjectId(user.id) }, { $set: { role: 'admin' } });

    const res = await api('GET', '/auth/me', { token });

    expect(res.body.role).toBe('admin');
  });

  it.each([
    ['no token', undefined],
    ['a malformed token', 'not.a.jwt'],
  ])('returns 401 UNAUTHENTICATED with %s', async (_label, token) => {
    const res = await api('GET', '/auth/me', { token });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for a well-formed token signed with a different secret', async () => {
    const { user } = await registerUser();
    const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const unsigned = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'admin', iat: now, exp: now + 3600 })}`;
    const forged = `${unsigned}.${createHmac('sha256', 'not-the-server-secret-but-32-chars-long').update(unsigned).digest('base64url')}`;

    const res = await api('GET', '/auth/me', { token: forged });

    expect(res.status).toBe(401);
  });

  it('returns 401 when the token belongs to a deleted user', async () => {
    const { user, token } = await registerUser();
    const db = await testDb();
    await db.collection('users').deleteOne({ _id: new ObjectId(user.id) });

    const res = await api('GET', '/auth/me', { token });

    expect(res.status).toBe(401);
  });
});
