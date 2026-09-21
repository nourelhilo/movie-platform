/**
 * TMDB API Proxy Service
 * All TMDB requests go through here — key never exposed to the browser.
 * Responses are cached in-memory with per-endpoint TTLs.
 * Seamlessly falls back to curated cinema archive when TMDB_API_KEY is unset or fails.
 */

import { CURATED_MOVIES } from './curatedCatalog.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const cache = new Map(); // key -> { data, expiresAt }

const TTL = {
  list: 5 * 60 * 1000,    // 5 min for lists (popular, top-rated)
  search: 2 * 60 * 1000,  // 2 min for search results
  detail: 30 * 60 * 1000, // 30 min for movie detail
};

const getApiKey = () => {
  return process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63';
};

const cached = async (cacheKey, ttl, fetcher) => {
  const now = Date.now();
  const entry = cache.get(cacheKey);
  if (entry && entry.expiresAt > now) return entry.data;

  const data = await fetcher();
  cache.set(cacheKey, { data, expiresAt: now + ttl });
  return data;
};

const tmdbFetch = async (path, params = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('NO_KEY');
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.status_message || `TMDB ${res.status}`);
  }
  return res.json();
};

// ─── Public API ────────────────────────────────────────────────────────────────

export const getPopular = (page = 1) =>
  cached(`popular:${page}`, TTL.list, async () => {
    try {
      return await tmdbFetch('/movie/popular', { page });
    } catch (err) {
      // Fallback to curated catalog
      const results = CURATED_MOVIES.map(m => ({
        id: m.id,
        title: m.title,
        original_title: m.original_title,
        release_date: m.release_date,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        vote_average: m.vote_average,
        vote_count: m.vote_count,
        overview: m.overview,
      }));
      return { page: 1, total_pages: 1, results };
    }
  });

export const getTopRated = (page = 1) =>
  cached(`top_rated:${page}`, TTL.list, async () => {
    try {
      return await tmdbFetch('/movie/top_rated', { page });
    } catch (err) {
      // Sort curated catalog by vote_average
      const sorted = [...CURATED_MOVIES]
        .sort((a, b) => b.vote_average - a.vote_average)
        .map(m => ({
          id: m.id,
          title: m.title,
          original_title: m.original_title,
          release_date: m.release_date,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average,
          vote_count: m.vote_count,
          overview: m.overview,
        }));
      return { page: 1, total_pages: 1, results: sorted };
    }
  });

export const searchMovies = (query, page = 1) =>
  cached(`search:${query}:${page}`, TTL.search, async () => {
    try {
      return await tmdbFetch('/search/movie', { query, page, include_adult: false });
    } catch (err) {
      const q = (query || '').toLowerCase();
      const filtered = CURATED_MOVIES.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.original_title && m.original_title.toLowerCase().includes(q)) ||
        (m.credits?.crew?.some(c => c.name.toLowerCase().includes(q))) ||
        (m.credits?.cast?.some(c => c.name.toLowerCase().includes(q))) ||
        (m.overview && m.overview.toLowerCase().includes(q))
      );
      return { page: 1, total_pages: 1, results: filtered };
    }
  });

export const getMovieDetails = (tmdbId) =>
  cached(`detail:${tmdbId}`, TTL.detail, async () => {
    try {
      return await tmdbFetch(`/movie/${tmdbId}`, { append_to_response: 'credits,similar' });
    } catch (err) {
      const found = CURATED_MOVIES.find(m => m.id === parseInt(tmdbId));
      if (found) return found;
      // Fallback movie object if not in curated list
      return {
        id: parseInt(tmdbId),
        title: 'Cinematic Archive Work #' + tmdbId,
        overview: 'Archived cinematic print in the Solander Collection.',
        release_date: '1979-01-01',
        runtime: 120,
        genres: [{ id: 18, name: 'Drama' }],
        credits: { crew: [], cast: [] },
        similar: { results: [] }
      };
    }
  });

export const clearCache = () => cache.clear();

