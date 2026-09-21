import express from 'express';
import { getPopular, getTopRated, searchMovies, getMovieDetail } from '../controllers/movieController.js';

const router = express.Router();

router.get('/popular', getPopular);
router.get('/top-rated', getTopRated);
router.get('/search', searchMovies);
router.get('/:tmdbId', getMovieDetail);

export default router;
