import mongoose from 'mongoose';
import { env } from './env.js';

// db/init-db.js owns collections and indexes (ADR-0002), so Mongoose must create neither.
export const connectDb = () => mongoose.connect(env.MONGODB_URI, { autoIndex: false, autoCreate: false });
