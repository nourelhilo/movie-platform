import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema(
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
    runtime: { type: Number, default: 0 },
    genres: [{ id: Number, name: String }],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    notes: {
      type: String,
      maxLength: 500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate entries per user
watchlistItemSchema.index({ userId: 1, tmdbId: 1 }, { unique: true });

export const WatchlistItem = mongoose.model('WatchlistItem', watchlistItemSchema);
export default WatchlistItem;
