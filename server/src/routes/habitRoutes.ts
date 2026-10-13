import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
} from '../controllers/habitController.js';

const router = Router();

// Enforce Firebase Bearer authentication on all habit endpoints
router.use(requireAuth);

router.get('/', getHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

export const habitRouter = router;
export default router;
