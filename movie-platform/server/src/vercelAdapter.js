import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initFirebaseAdmin } from './config/firebaseAdmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });

let initialized = false;
let initPromise = null;

async function ensureInit() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      initFirebaseAdmin();
      await connectDB();
      initialized = true;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

export default async function handler(req, res) {
  await ensureInit();
  return app(req, res);
}
