import express from 'express';
import { getDBStatus } from '../config/db.js';
import { getFirebaseAdminStatus } from '../config/firebaseAdmin.js';

const router = express.Router();

router.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const firebaseStatus = getFirebaseAdminStatus();
  const hasTmdb = !!(process.env.TMDB_ACCESS_TOKEN || process.env.TMDB_API_KEY);

  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: {
        connected: dbStatus.connected,
        readyState: dbStatus.readyState,
        host: dbStatus.host,
      },
      firebaseAdmin: {
        initialized: firebaseStatus.initialized,
        hasServiceAccount: firebaseStatus.hasServiceAccount,
      },
      tmdb: {
        configured: hasTmdb,
      },
    },
  });
});

export default router;
