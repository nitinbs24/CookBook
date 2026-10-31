import { describe, expect, it } from 'vitest';
import { User } from '../src/models/User.js';

describe('User toJSON', () => {
  it('exposes id as a string and hides _id, __v, and passwordHash', () => {
    const user = new User({ name: 'Asha', email: 'a@example.com', passwordHash: 'h'.repeat(60) });

    const json = user.toJSON();

    expect(json.id).toBe(user._id.toString());
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
    expect(json).not.toHaveProperty('passwordHash');
    expect(json.role).toBe('user');
  });
});
