import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initFirebaseAdmin } from './config/firebaseAdmin.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('----------------------------------------------------');
  console.log('Starting Movie Discovery & Tracking Platform Server');
  console.log('----------------------------------------------------');

  // Initialize Firebase Admin SDK
  initFirebaseAdmin();

  // Connect to MongoDB
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`[Express] Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    console.log(`[Express] Health check accessible at http://localhost:${PORT}/api/v1/health`);
    console.log('----------------------------------------------------');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[Unhandled Rejection Error]:', err.message);
  });
};

startServer();
