// Usage: npm run create-admin -- <email> <password> [name]
// Promotes an existing user to admin, or creates a new admin. /auth/register never makes admins.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { registerSchema } from '../src/validators/index.js';

const [rawEmail, password, name = 'Admin'] = process.argv.slice(2);
const input = registerSchema.safeParse({ email: rawEmail, password, name });
if (!input.success) {
  console.error(`Usage: npm run create-admin -- <email> <password> [name]\n${input.error.issues[0].message}`);
  process.exit(1);
}

await connectDb();
const { email } = input.data;
const existing = await User.findOne({ email });
if (existing) {
  existing.role = 'admin';
  await existing.save();
  console.log(`Promoted ${email} to admin (password unchanged)`);
} else {
  const passwordHash = await bcrypt.hash(input.data.password, 12);
  await User.create({ name: input.data.name, email, passwordHash, role: 'admin' });
  console.log(`Created admin ${email}`);
}
await mongoose.disconnect();
