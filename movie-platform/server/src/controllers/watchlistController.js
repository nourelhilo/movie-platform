import mongoose from 'mongoose';
import WatchlistItem from '../models/WatchlistItem.js';

// In-memory watchlist store fallback when MongoDB is not connected
const memoryWatchlist = [];

// ─── GET /watchlist ─────────────────────────────────────────────────────────────
export const getWatchlist = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const items = await WatchlistItem.find({ userId }).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, items });
    }

    // In-memory fallback
    const items = memoryWatchlist
      .filter(item => String(item.userId) === String(userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, items });
  } catch (err) {
    next(err);
  }
};

// ─── POST /watchlist ────────────────────────────────────────────────────────────
export const addToWatchlist = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const { tmdbId, title, posterPath, year, runtime, genres, priority, notes } = req.body;

    if (!tmdbId || !title) {
      return res.status(400).json({ success: false, message: 'tmdbId and title are required' });
    }

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const item = await WatchlistItem.findOneAndUpdate(
        { userId, tmdbId: parseInt(tmdbId) },
        { 
          userId, 
          tmdbId: parseInt(tmdbId), 
          title, 
          posterPath: posterPath || '', 
          year, 
          runtime: runtime || 0, 
          genres: genres || [], 
          priority: priority || 'medium', 
          notes: notes || '' 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(201).json({ success: true, item });
    }

    // In-memory fallback
    let item = memoryWatchlist.find(i => String(i.userId) === String(userId) && i.tmdbId === parseInt(tmdbId));
    if (item) {
      item.priority = priority || item.priority;
      item.notes = notes !== undefined ? notes : item.notes;
      item.updatedAt = new Date();
    } else {
      item = {
        _id: 'mem_wl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId,
        tmdbId: parseInt(tmdbId),
        title,
        posterPath: posterPath || '',
        year,
        runtime: runtime || 0,
        genres: genres || [],
        priority: priority || 'medium',
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryWatchlist.unshift(item);
    }

    res.status(201).json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /watchlist/:id ───────────────────────────────────────────────────────
export const updateWatchlistItem = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const item = await WatchlistItem.findOne({ _id: req.params.id, userId });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      const { priority, notes } = req.body;
      if (priority !== undefined) item.priority = priority;
      if (notes !== undefined) item.notes = notes;

      await item.save();
      return res.json({ success: true, item });
    }

    // In-memory fallback
    const item = memoryWatchlist.find(i => i._id === req.params.id && String(i.userId) === String(userId));
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const { priority, notes } = req.body;
    if (priority !== undefined) item.priority = priority;
    if (notes !== undefined) item.notes = notes;
    item.updatedAt = new Date();

    res.json({ success: true, item });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /watchlist/:id ──────────────────────────────────────────────────────
export const removeFromWatchlist = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const item = await WatchlistItem.findOneAndDelete({ _id: req.params.id, userId });
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.json({ success: true, message: 'Removed from watchlist' });
    }

    // In-memory fallback
    const idx = memoryWatchlist.findIndex(i => i._id === req.params.id && String(i.userId) === String(userId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });
    memoryWatchlist.splice(idx, 1);

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /watchlist/check/:tmdbId ──────────────────────────────────────────────
export const checkWatchlistItem = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const tmdbId = parseInt(req.params.tmdbId);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const item = await WatchlistItem.findOne({ userId, tmdbId }).lean();
      return res.json({ success: true, inWatchlist: !!item, item: item || null });
    }

    const item = memoryWatchlist.find(i => String(i.userId) === String(userId) && i.tmdbId === tmdbId);
    res.json({ success: true, inWatchlist: !!item, item: item || null });
  } catch (err) {
    next(err);
  }
};

