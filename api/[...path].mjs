import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

let connectionPromise;

async function ensureDbConnection() {
  if (!connectionPromise) {
    connectionPromise = connectDB().catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  await connectionPromise;
}

export default async function handler(req, res) {
  await ensureDbConnection();
  return app(req, res);
}
