import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDB } from '../src/config/db.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sortmyscene';

const app = createApp();

let dbPromise = null;
function ensureDB() {
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
    // This path bypasses Express, so set CORS headers here too — otherwise the
    // browser reports a cold-start DB error as a CORS failure.
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Database connection failed' }));
    return;
  }
  return app(req, res);
}
