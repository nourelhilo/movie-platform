import axios from 'axios';
import { auth, isFirebaseConfigured } from '../config/firebase.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      if (isFirebaseConfigured && auth && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        const storedUser = localStorage.getItem('solander_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          config.headers.Authorization = `Bearer mock-token-${parsed.username || 'user'}`;
        }
      }
    } catch (err) {
      console.warn('[API Client] Could not attach auth token:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred.',
      errors: error.response?.data?.errors || null,
    };
    return Promise.reject(customError);
  }
);

export default api;

export const getPopularMovies = (page = 1) => api.get(`/movies/popular?page=${page}`);
export const getTopRatedMovies = (page = 1) => api.get(`/movies/top-rated?page=${page}`);
export const searchMovies = (q, page = 1) => api.get(`/movies/search?q=${encodeURIComponent(q)}&page=${page}`);
export const getMovieDetail = (tmdbId) => api.get(`/movies/${tmdbId}`);

export const getDiary = (page = 1, limit = 20) => api.get(`/diary?page=${page}&limit=${limit}`);
export const addDiaryEntry = (data) => api.post('/diary', data);
export const updateDiaryEntry = (id, data) => api.put(`/diary/${id}`, data);
export const deleteDiaryEntry = (id) => api.delete(`/diary/${id}`);
export const checkDiaryEntry = (tmdbId) => api.get(`/diary/check/${tmdbId}`);

export const getWatchlist = () => api.get('/watchlist');
export const addToWatchlist = (data) => api.post('/watchlist', data);
export const updateWatchlistItem = (id, data) => api.patch(`/watchlist/${id}`, data);
export const removeFromWatchlist = (id) => api.delete(`/watchlist/${id}`);
export const checkWatchlistItem = (tmdbId) => api.get(`/watchlist/check/${tmdbId}`);

