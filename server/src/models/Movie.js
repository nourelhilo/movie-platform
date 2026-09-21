import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    tmdbId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    originalTitle: String,
    overview: String,
    releaseDate: Date,
    year: {
      type: Number,
      index: true,
    },
    runtime: {
      type: Number,
      default: 0,
    },
    genres: [
      {
        id: Number,
        name: String,
      },
    ],
    originalLanguage: String,
    originCountries: [String],
    posterPath: String,
    backdropPath: String,
    directors: [
      {
        tmdbPersonId: Number,
        name: String,
      },
    ],
    mainCast: [
      {
        tmdbPersonId: Number,
        name: String,
        character: String,
      },
    ],
    voteAverage: {
      type: Number,
      default: 0,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
    popularity: Number,
  },
  {
    timestamps: true,
  }
);

// Helpful index for genre and year filtering
movieSchema.index({ 'genres.name': 1, year: 1 });

export const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
