import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      maxLength: 300,
      default: '',
    },
    favoriteMovies: [
      {
        tmdbId: { type: Number, required: true },
        title: { type: String, required: true },
        posterPath: String,
        year: Number,
      },
    ],
    statsSummary: {
      totalWatched: { type: Number, default: 0 },
      totalMinutes: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      reviewsCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
export default User;
