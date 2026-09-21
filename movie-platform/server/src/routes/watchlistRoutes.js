import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
  checkWatchlistItem,
} from '../controllers/watchlistController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.get('/check/:tmdbId', checkWatchlistItem);
router.patch('/:id', updateWatchlistItem);
router.delete('/:id', removeFromWatchlist);

export default router;
