import { Router, Request, Response, NextFunction } from 'express';
import { getAnalytics } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', (req: Request, res: Response, next: NextFunction) => getAnalytics(req, res, next));
export default router;
