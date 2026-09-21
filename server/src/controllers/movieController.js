import mongoose from 'mongoose';
import * as tmdb from '../services/tmdb.js';
import Movie from '../models/Movie.js';

// ─── GET /movies/popular?page=1 ────────────────────────────────────────────────
export const getPopular = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdb.getPopular(page);
    res.json({ success: true, page: data.page, totalPages: data.total_pages, results: data.results });
  } catch (err) {
    next(err);
  }
};

// ─── GET /movies/top-rated?page=1 ──────────────────────────────────────────────
export const getTopRated = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdb.getTopRated(page);
    res.json({ success: true, page: data.page, totalPages: data.total_pages, results: data.results });
  } catch (err) {
    next(err);
  }
};

// ─── GET /movies/search?q=query&page=1 ─────────────────────────────────────────
export const searchMovies = async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q || q.trim().length < 1) {
      return res.json({ success: true, page: 1, totalPages: 0, results: [] });
    }
    const data = await tmdb.searchMovies(q.trim(), parseInt(page));
    res.json({ success: true, page: data.page, totalPages: data.total_pages, results: data.results });
  } catch (err) {
    next(err);
  }
};

// ─── GET /movies/:tmdbId ────────────────────────────────────────────────────────
export const getMovieDetail = async (req, res, next) => {
  try {
    const tmdbId = parseInt(req.params.tmdbId);
    if (isNaN(tmdbId)) return res.status(400).json({ success: false, message: 'Invalid movie ID' });

    const data = await tmdb.getMovieDetails(tmdbId);

    // Upsert minimal doc into MongoDB for diary/watchlist reference integrity if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Movie.findOneAndUpdate(
          { tmdbId },
          {
            tmdbId,
            title: data.title,
            originalTitle: data.original_title,
            overview: data.overview,
            releaseDate: data.release_date ? new Date(data.release_date) : null,
            year: data.release_date ? parseInt(data.release_date.split('-')[0]) : null,
            runtime: data.runtime || 0,
            genres: data.genres || [],
            originalLanguage: data.original_language,
            posterPath: data.poster_path,
            backdropPath: data.backdrop_path,
            voteAverage: data.vote_average,
            voteCount: data.vote_count,
            popularity: data.popularity,
            directors: (data.credits?.crew || [])
              .filter(p => p.job === 'Director')
              .map(p => ({ tmdbPersonId: p.id, name: p.name })),
            mainCast: (data.credits?.cast || [])
              .slice(0, 10)
              .map(p => ({ tmdbPersonId: p.id, name: p.name, character: p.character })),
          },
          { upsert: true, new: true }
        );
      } catch (dbErr) {
        console.warn('[MovieController] Cache upsert skipped:', dbErr.message);
      }
    }

    // Shape response
    const directors = (data.credits?.crew || []).filter(p => p.job === 'Director');
    const cast = (data.credits?.cast || []).slice(0, 10);
    const similar = (data.similar?.results || []).slice(0, 12);

    res.json({
      success: true,
      movie: {
        tmdbId: data.id,
        title: data.title,
        originalTitle: data.original_title,
        tagline: data.tagline,
        overview: data.overview,
        releaseDate: data.release_date,
        year: data.release_date ? parseInt(data.release_date.split('-')[0]) : null,
        runtime: data.runtime,
        genres: data.genres,
        originalLanguage: data.original_language,
        originCountries: data.origin_country || [],
        posterPath: data.poster_path,
        backdropPath: data.backdrop_path,
        voteAverage: data.vote_average,
        voteCount: data.vote_count,
        directors,
        cast,
        similar,
      },
    });
  } catch (err) {
    next(err);
  }
};
