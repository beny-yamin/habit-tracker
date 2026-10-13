import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getLogsRange,
  batchSyncLogs,
  upsertLog,
  getLogAnalytics,
} from '../controllers/logController.js';

const router = Router();

// Enforce Firebase Bearer authentication on all log endpoints
router.use(requireAuth);

router.get('/range', getLogsRange);
router.post('/batch', batchSyncLogs);
router.post('/', upsertLog);
router.get('/analytics', getLogAnalytics);

export const logRouter = router;
export default router;
