import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log('[MongoDB] Using existing database connection');
    return;
  }

  mongoose.set('bufferCommands', false);

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie_platform';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 7500,
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${uri}: ${error.message}`);
    console.warn('[MongoDB Warning] In-memory degraded mode active. Set MONGODB_URI in server/.env when ready.');
  }
};

export const getDBStatus = () => {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'none',
    databaseName: mongoose.connection.name || 'none'
  };
};
