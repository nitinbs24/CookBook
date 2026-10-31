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

/** Trimmed with single inner spaces, so the case-insensitive dish filter matches exactly. */
export const normalizeDish = (s) => s.trim().replace(/\s+/g, ' ');

// Optional fields are always stored, as null when absent, so both backends write identical documents.
const opt = (schema) => schema.nullish().transform((v) => v ?? null);
const minutes = z.number().int().min(0).max(1440);

export const recipeSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: opt(z.string().trim().max(500)),
  dishName: z.string().transform(normalizeDish).pipe(z.string().min(2).max(80)),
  foodType: z.enum(['veg', 'nonveg']),
  category: z.string().trim().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  servings: z.number().int().min(1).max(50),
  prepTimeMin: minutes,
  cookTimeMin: minutes,
  // publicId must be in our folder: recipe deletes destroy images by publicId (Phase 3).
  images: z
    .array(z.object({ url: z.url({ protocol: /^https$/ }).max(500), publicId: z.string().regex(/^recipebook\/[\w-]+$/).max(300) }))
    .min(1)
    .max(3),
  ingredients: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        quantity: opt(z.number().min(0)),
        unit: opt(z.string().trim().max(20)),
        note: opt(z.string().trim().max(60)),
      }),
    )
    .min(1)
    .max(40),
  instructions: z
    .array(
      z.object({
        section: opt(z.string().trim().max(40)),
        steps: z
          .array(z.object({ text: z.string().trim().min(3).max(600), durationMin: opt(minutes), tip: opt(z.string().trim().max(200)) }))
          .min(1)
          .max(30),
      }),
    )
    .min(1)
    .max(8),
});

const page = z.coerce.number().int().min(1).default(1);
const limit = (dflt) => z.coerce.number().int().min(1).max(50).default(dflt);

export const listQuery = foodTypeQuery.extend({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).optional(),
  dish: z.string().trim().min(1).max(80).optional(),
  page,
  limit: limit(12),
});

export const trendingQuery = foodTypeQuery.extend({
  days: z.coerce.number().int().min(1).max(365).default(7),
  limit: limit(10),
});
