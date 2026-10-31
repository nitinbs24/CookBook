import { z } from 'zod';

// Validating every input as typed strings/numbers also blocks NoSQL injection ({"$gt": ""}).
const email = z.string().trim().toLowerCase();

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: email.pipe(z.email()),
  password: z.string().min(8).max(72), // bcrypt ignores bytes past 72
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

/** Parses `?foodType`; the result doubles as the Mongo filter ({} means Both). */
export const foodTypeQuery = z.object({
  foodType: z.enum(['veg', 'nonveg']).optional(),
});
