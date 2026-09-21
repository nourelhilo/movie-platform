import express from 'express';
import { syncUser, getMe, updateProfile } from '../controllers/authController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Synchronize Firebase auth with MongoDB (can accept token in header or body)
router.post('/sync', optionalAuth, syncUser);

// Get authenticated user profile & stats
router.get('/me', requireAuth, getMe);

// Update user settings, bio, or favorite 4 films
router.patch('/me', requireAuth, updateProfile);

export default router;
