import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { router } from './routes/index.js';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' })); // a max-size recipe (8 sections × 30 steps × 600 chars) is ~150 KB
app.use('/api/v1', router);
app.use(notFound);
app.use(errorHandler);
