import admin from 'firebase-admin';
import mongoose from 'mongoose';
import User from '../models/User.js';

// In-memory user fallback store when MongoDB is not connected in development
const memoryUsers = new Map();

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token required. Please include "Authorization: Bearer <token>" header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    let decodedToken;

    // Check if Firebase Admin is fully initialized with service account
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (firebaseErr) {
      // In development mode, if a mock token is sent or service account is missing
      if (token.startsWith('mock-token-') || process.env.NODE_ENV === 'development') {
        const mockUid = token.startsWith('mock-token-') ? token.replace('mock-token-', '') : 'demo_user';
        decodedToken = {
          uid: mockUid,
          email: `${mockUid}@movieplatform.dev`,
          name: mockUid,
        };
      } else {
        throw firebaseErr;
      }
    }

    if (!decodedToken || !decodedToken.uid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    // Attach decoded Firebase user to request
    req.firebaseUser = decodedToken;

    const isDbConnected = mongoose.connection.readyState === 1;

    let user;
    if (isDbConnected) {
      user = await User.findOne({ firebaseUid: decodedToken.uid });

      if (!user) {
        const email = decodedToken.email || `${decodedToken.uid}@movieplatform.dev`;
        const baseUsername = (decodedToken.name || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
        const username = `${baseUsername || 'cinephile'}_${uniqueSuffix}`;

        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: email,
          username: username,
          displayName: decodedToken.name || username,
          avatarUrl: decodedToken.picture || '',
        });
        console.log(`[Auth] Auto-provisioned new MongoDB user: @${user.username} (${user.email})`);
      }
    } else {
      // In-memory fallback
      user = memoryUsers.get(decodedToken.uid);
      if (!user) {
        const baseUsername = (decodedToken.name || decodedToken.email?.split('@')[0] || 'cinephile')
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '');
        const username = `${baseUsername || 'cinephile'}_demo`;

        user = {
          _id: 'mem_' + decodedToken.uid,
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || `${decodedToken.uid}@movieplatform.dev`,
          username: username,
          displayName: decodedToken.name || baseUsername,
          avatarUrl: decodedToken.picture || '',
          favoriteMovies: [],
          statsSummary: { totalWatched: 0, totalMinutes: 0, averageRating: 0, reviewsCount: 0 },
        };
        memoryUsers.set(decodedToken.uid, user);
      }
    }

    req.user = user;
    req.mongoUser = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. ' + error.message,
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      if (token.startsWith('mock-token-') || process.env.NODE_ENV === 'development') {
        const mockUid = token.startsWith('mock-token-') ? token.replace('mock-token-', '') : 'demo_user';
        decodedToken = { uid: mockUid, email: `${mockUid}@movieplatform.dev`, name: mockUid };
      }
    }

    if (decodedToken && decodedToken.uid) {
      req.firebaseUser = decodedToken;
      if (mongoose.connection.readyState === 1) {
        req.user = await User.findOne({ firebaseUid: decodedToken.uid });
      } else {
        req.user = memoryUsers.get(decodedToken.uid) || {
          _id: 'mem_' + decodedToken.uid,
          firebaseUid: decodedToken.uid,
          username: 'cinephile_demo',
          displayName: 'Cinephile',
        };
      }
      req.mongoUser = req.user;
    }
  } catch (err) {
    // Silently ignore errors for optional auth
  }

  next();
};

export const authMiddleware = requireAuth;
export default requireAuth;

