import { MongoClient } from 'mongodb';
import { TEST_MONGODB_URI } from './config.js';

let client;

/** Direct handle on the test database, for arranging state the API can't create (e.g. an admin). */
export async function testDb() {
  client ??= await MongoClient.connect(TEST_MONGODB_URI);
  return client.db();
}

/** Empties every collection except `categories` (seeded by init-db.js). */
export async function resetDb() {
  const db = await testDb();
  await Promise.all(['users', 'recipes', 'reviews', 'likes'].map((c) => db.collection(c).deleteMany({})));
}

export async function closeDb() {
  await client?.close();
  client = undefined;
}
