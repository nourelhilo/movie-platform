import mongoose from 'mongoose';

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tmdbId: { type: Number, required: true },
    title: { type: String, required: true },
    posterPath: { type: String, default: '' },
    year: { type: Number },
    runtime: { type: Number, default: 0 },  // in minutes, from TMDB
    rating: {
      type: Number,
      min: 0.5,
      max: 5.0,
      required: true,
    },
    review: {
      type: String,
      maxLength: 5000,
      default: '',
    },
    watchedOn: {
      type: Date,
      default: Date.now,
    },
    rewatchCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isRewatch: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt = log date (sorted by this)
  }
);

// Compound index for efficient per-user sorted queries
diaryEntrySchema.index({ userId: 1, createdAt: -1 });
diaryEntrySchema.index({ userId: 1, tmdbId: 1 });

export const DiaryEntry = mongoose.model('DiaryEntry', diaryEntrySchema);
export default DiaryEntry;
