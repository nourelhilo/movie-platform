import mongoose from 'mongoose';
import User from '../models/User.js';

// Transient fallback store for development before MongoDB URI is added
const memoryUsers = new Map();

export const syncUser = async (req, res, next) => {
  try {
    const { firebaseUid, email, displayName, photoURL, username: chosenUsername } = req.body;

    const uid = req.firebaseUser?.uid || firebaseUid;
    const userEmail = req.firebaseUser?.email || email;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required for user synchronization.',
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      let user = await User.findOne({ firebaseUid: uid });

      if (!user) {
        let username;

        if (chosenUsername && chosenUsername.trim()) {
          // Use what the user typed; if taken, find the next available variant
          const base = chosenUsername.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
          let candidate = base;
          let counter = 2;
          while (await User.findOne({ username: candidate })) {
            candidate = `${base}_${counter}`;
            counter++;
            if (counter > 9) {
              // Last resort: random suffix
              candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
              break;
            }
          }
          username = candidate;
        } else {
          // No username provided — derive from displayName or email
          const base = (displayName || userEmail?.split('@')[0] || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');
          const suffix = Math.floor(1000 + Math.random() * 9000);
          username = `${base}_${suffix}`;
        }

        user = await User.create({
          firebaseUid: uid,
          email: userEmail || `${uid}@movieplatform.dev`,
          username: username,
          displayName: displayName || username,
          avatarUrl: photoURL || '',
        });

        console.log(`[Auth Controller] Created new MongoDB user for @${user.username}`);
      } else {
        let hasUpdates = false;
        if (photoURL && !user.avatarUrl) {
          user.avatarUrl = photoURL;
          hasUpdates = true;
        }
        if (displayName && (!user.displayName || user.displayName === user.username)) {
          user.displayName = displayName;
          hasUpdates = true;
        }
        if (hasUpdates) {
          await user.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: 'User synchronized successfully in MongoDB',
        data: user,
      });
    }

    // In-memory fallback if MongoDB is not yet connected
    let memoryUser = memoryUsers.get(uid);
    if (!memoryUser) {
      const baseUsername = (displayName || userEmail?.split('@')[0] || 'cinephile')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const username = `${baseUsername}_demo`;

      memoryUser = {
        _id: 'mem_' + uid,
        firebaseUid: uid,
        email: userEmail || `${uid}@movieplatform.dev`,
        username: username,
        displayName: displayName || baseUsername,
        avatarUrl: photoURL || '',
        favoriteMovies: [],
        statsSummary: { totalWatched: 0, totalMinutes: 0, averageRating: 0, reviewsCount: 0 },
      };
      memoryUsers.set(uid, memoryUser);
    }

    return res.status(200).json({
      success: true,
      message: 'User synchronized in memory (awaiting MongoDB connection)',
      data: memoryUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    let user = req.user;
    if (mongoose.connection.readyState === 1 && user._id) {
      const fresh = await User.findById(user._id);
      if (fresh) user = fresh;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { bio, displayName, favoriteMovies, username } = req.body;
    const user = req.user;

    if (username && username !== user.username) {
      if (mongoose.connection.readyState === 1) {
        const existing = await User.findOne({ username: username.toLowerCase().trim() });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: 'Username is already taken.',
          });
        }
      }
      user.username = username.toLowerCase().trim();
    }

    if (bio !== undefined) user.bio = bio;
    if (displayName) user.displayName = displayName;
    if (Array.isArray(favoriteMovies)) {
      user.favoriteMovies = favoriteMovies.slice(0, 4);
    }

    if (typeof user.save === 'function') {
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
