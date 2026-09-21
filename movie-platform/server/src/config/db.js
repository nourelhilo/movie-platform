import mongoose from 'mongoose';

const globalCache = globalThis;
if (!globalCache.__solanderMongo) {
  globalCache.__solanderMongo = { isConnected: false };
}

export const connectDB = async () => {
  if (globalCache.__solanderMongo.isConnected || mongoose.connection.readyState === 1) {
    globalCache.__solanderMongo.isConnected = true;
    return;
  }

  mongoose.set('bufferCommands', false);

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movie_platform';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    globalCache.__solanderMongo.isConnected = true;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to MongoDB: ${error.message}`);
    console.warn('[MongoDB Warning] In-memory degraded mode active.');
  }
};

export const getDBStatus = () => {
  return {
    connected: globalCache.__solanderMongo.isConnected && mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'none',
    databaseName: mongoose.connection.name || 'none'
  };
};
