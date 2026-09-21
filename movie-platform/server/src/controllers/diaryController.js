import mongoose from 'mongoose';
import DiaryEntry from '../models/DiaryEntry.js';
import User from '../models/User.js';
import { getMovieDetails } from '../services/tmdb.js';

// In-memory diary fallback store when MongoDB is not connected
const memoryDiary = [];

// Recalculate and persist user statsSummary after any diary mutation
const syncUserStats = async (userId) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) return;

  try {
    const entries = await DiaryEntry.find({ userId });
    const totalWatched = entries.length;

    // Ensure all entries have a valid runtime (backfill if 0 or missing from earlier logs)
    let totalMinutes = 0;
    for (const e of entries) {
      let entryRuntime = Number(e.runtime) || 0;
      if (entryRuntime <= 0 && e.tmdbId) {
        try {
          const detail = await getMovieDetails(e.tmdbId);
          if (detail?.runtime && Number(detail.runtime) > 0) {
            entryRuntime = Number(detail.runtime);
            await DiaryEntry.findByIdAndUpdate(e._id, { runtime: entryRuntime });
          } else {
            entryRuntime = 105;
            await DiaryEntry.findByIdAndUpdate(e._id, { runtime: 105 });
          }
        } catch (err) {
          entryRuntime = 105;
        }
      }
      totalMinutes += (entryRuntime || 105);
    }

    const reviewsCount = entries.filter(e => e.review && e.review.trim().length > 0).length;
    const ratedEntries = entries.filter(e => typeof e.rating === 'number' && e.rating > 0);
    const averageRating = ratedEntries.length > 0
      ? Math.round((ratedEntries.reduce((sum, e) => sum + e.rating, 0) / ratedEntries.length) * 10) / 10
      : 0;

    await User.findByIdAndUpdate(userId, {
      'statsSummary.totalWatched': totalWatched,
      'statsSummary.totalMinutes': totalMinutes,
      'statsSummary.reviewsCount': reviewsCount,
      'statsSummary.averageRating': averageRating,
    });
  } catch (err) {
    console.warn('[syncUserStats] Warning:', err.message);
  }
};

// ─── GET /diary?page=1&limit=20 ────────────────────────────────────────────────
export const getDiary = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const [entries, total] = await Promise.all([
        DiaryEntry.find({ userId })
          .sort({ watchedOn: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DiaryEntry.countDocuments({ userId }),
      ]);

      // If any entries have missing runtime, trigger background backfill and stats recalculation
      if (entries.some(e => !e.runtime || Number(e.runtime) <= 0)) {
        syncUserStats(userId).catch(() => {});
      }

      return res.json({
        success: true,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        total,
        entries,
      });
    }

    // In-memory fallback
    const userEntries = memoryDiary
      .filter(e => String(e.userId) === String(userId))
      .sort((a, b) => new Date(b.watchedOn || b.createdAt) - new Date(a.watchedOn || a.createdAt));

    const total = userEntries.length;
    const paginated = userEntries.slice(skip, skip + limit);

    res.json({
      success: true,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
      entries: paginated,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /diary ────────────────────────────────────────────────────────────────
export const addDiaryEntry = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    let { tmdbId, title, posterPath, year, runtime, rating, review, watchedOn, isRewatch, tags } = req.body;

    if (!tmdbId || !title || !rating) {
      return res.status(400).json({ success: false, message: 'tmdbId, title, and rating are required' });
    }

    let movieRuntime = Number(runtime) || 0;
    if (movieRuntime <= 0 && tmdbId) {
      try {
        const detail = await getMovieDetails(tmdbId);
        if (detail?.runtime && Number(detail.runtime) > 0) {
          movieRuntime = Number(detail.runtime);
        } else {
          movieRuntime = 105;
        }
      } catch (err) {
        movieRuntime = 105;
      }
    }
    if (movieRuntime <= 0) movieRuntime = 105;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const entry = await DiaryEntry.create({
        userId,
        tmdbId: parseInt(tmdbId),
        title,
        posterPath: posterPath || '',
        year,
        runtime: movieRuntime,
        rating: Number(rating),
        review: review || '',
        watchedOn: watchedOn ? new Date(watchedOn) : new Date(),
        isRewatch: !!isRewatch,
        tags: tags || [],
      });

      await syncUserStats(userId);
      return res.status(201).json({ success: true, entry });
    }

    // In-memory fallback
    const entry = {
      _id: 'mem_diary_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      tmdbId: parseInt(tmdbId),
      title,
      posterPath: posterPath || '',
      year,
      rating: Number(rating),
      review: review || '',
      watchedOn: watchedOn ? new Date(watchedOn) : new Date(),
      isRewatch: !!isRewatch,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryDiary.unshift(entry);

    res.status(201).json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /diary/:id ─────────────────────────────────────────────────────────────
export const updateDiaryEntry = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const entry = await DiaryEntry.findOne({ _id: req.params.id, userId });
      if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

      const { rating, review, watchedOn, isRewatch, tags } = req.body;
      if (rating !== undefined) entry.rating = Number(rating);
      if (review !== undefined) entry.review = review;
      if (watchedOn !== undefined) entry.watchedOn = new Date(watchedOn);
      if (isRewatch !== undefined) entry.isRewatch = isRewatch;
      if (tags !== undefined) entry.tags = tags;

      await entry.save();
      await syncUserStats(userId);
      return res.json({ success: true, entry });
    }

    // In-memory fallback
    const entry = memoryDiary.find(e => e._id === req.params.id && String(e.userId) === String(userId));
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

    const { rating, review, watchedOn, isRewatch, tags } = req.body;
    if (rating !== undefined) entry.rating = Number(rating);
    if (review !== undefined) entry.review = review;
    if (watchedOn !== undefined) entry.watchedOn = new Date(watchedOn);
    if (isRewatch !== undefined) entry.isRewatch = isRewatch;
    if (tags !== undefined) entry.tags = tags;
    entry.updatedAt = new Date();

    res.json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /diary/:id ──────────────────────────────────────────────────────────
export const deleteDiaryEntry = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const entry = await DiaryEntry.findOneAndDelete({ _id: req.params.id, userId });
      if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });

      await syncUserStats(userId);
      return res.json({ success: true, message: 'Entry deleted' });
    }

    // In-memory fallback
    const idx = memoryDiary.findIndex(e => e._id === req.params.id && String(e.userId) === String(userId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Entry not found' });
    memoryDiary.splice(idx, 1);

    res.json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /diary/check/:tmdbId — is this movie already logged? ──────────────────
export const checkDiaryEntry = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.mongoUser?._id;
    const tmdbId = parseInt(req.params.tmdbId);
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      const entry = await DiaryEntry.findOne({ userId, tmdbId }).lean();
      return res.json({ success: true, logged: !!entry, entry: entry || null });
    }

    const entry = memoryDiary.find(e => String(e.userId) === String(userId) && e.tmdbId === tmdbId);
    res.json({ success: true, logged: !!entry, entry: entry || null });
  } catch (err) {
    next(err);
  }
};

