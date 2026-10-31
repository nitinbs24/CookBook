import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

await connectDb();
app.listen(env.PORT, () => console.log(`Express API on http://localhost:${env.PORT}/api/v1`));
