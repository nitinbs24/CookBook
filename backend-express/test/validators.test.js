import { describe, expect, it } from 'vitest';
import { foodTypeQuery, loginSchema, registerSchema } from '../src/validators/index.js';

describe('registerSchema', () => {
  const valid = { name: '  Asha  ', email: ' Asha@Example.COM ', password: 'password123' };

  it('trims the name and trims and lowercases the email', () => {
    expect(registerSchema.parse(valid)).toEqual({ name: 'Asha', email: 'asha@example.com', password: 'password123' });
  });

  it('drops fields the client must not set, such as role', () => {
    expect(registerSchema.parse({ ...valid, role: 'admin' })).not.toHaveProperty('role');
  });

  it('accepts a 72-char password and rejects 7 or 73', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'x'.repeat(72) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, password: 'x'.repeat(7) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'x'.repeat(73) }).success).toBe(false);
  });

  it('rejects names outside 2–60 chars after trimming', () => {
    expect(registerSchema.safeParse({ ...valid, name: ' A ' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: 'x'.repeat(61) }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('rejects a non-string email (blocks {"$gt": ""} injection)', () => {
    expect(loginSchema.safeParse({ email: { $gt: '' }, password: 'x' }).success).toBe(false);
  });

  it('lowercases the email so login is case-insensitive', () => {
    expect(loginSchema.parse({ email: 'A@B.CO', password: 'x' }).email).toBe('a@b.co');
  });
});

describe('foodTypeQuery', () => {
  it('maps a missing foodType to an empty filter (Both)', () => {
    expect(foodTypeQuery.parse({})).toEqual({});
  });

  it('accepts veg and nonveg and rejects anything else', () => {
    expect(foodTypeQuery.parse({ foodType: 'veg' })).toEqual({ foodType: 'veg' });
    expect(foodTypeQuery.safeParse({ foodType: 'vegan' }).success).toBe(false);
  });
});
