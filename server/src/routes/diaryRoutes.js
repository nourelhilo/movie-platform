import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getDiary,
  addDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
  checkDiaryEntry,
} from '../controllers/diaryController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getDiary);
router.post('/', addDiaryEntry);
router.get('/check/:tmdbId', checkDiaryEntry);
router.put('/:id', updateDiaryEntry);
router.delete('/:id', deleteDiaryEntry);

export default router;
