import { Router, Request, Response, NextFunction } from 'express';
import * as notif from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => notif.getNotifications(req, res, next));
router.patch('/:id/read', (req: Request, res: Response, next: NextFunction) => notif.markRead(req, res, next));
router.patch('/all/read', (req: Request, res: Response, next: NextFunction) => notif.markRead(req, res, next));

export default router;
