import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getMonthlyReport,
  saveReflection,
  getReflection,
} from '../controllers/reportController.js';

const router = Router();

// Enforce Firebase Bearer authentication on all report endpoints
router.use(requireAuth);

router.get('/monthly', getMonthlyReport);
router.post('/reflections', saveReflection);
router.get('/reflections', getReflection);
router.get('/reflections/:monthKey', getReflection);

export const reportRouter = router;
export default router;
