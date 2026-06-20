import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

// Vercel serverless entry. The default export is a (req, res) handler, which is
// what Vercel expects. We connect to Mongo lazily and cache the connection
// across warm invocations so each request doesn't re-dial the database.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sortmyscene';

const app = createApp();

let dbPromise = null;
function ensureDB() {
  // 1 === connected
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!dbPromise) {
    dbPromise = connectDB(MONGODB_URI).catch((err) => {
      dbPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return dbPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDB();
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Database connection failed' }));
    return;
  }
  return app(req, res);
}
