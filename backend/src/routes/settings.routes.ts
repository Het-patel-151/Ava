import { Router, Request, Response, NextFunction } from 'express';
import * as settings from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => settings.getSettings(req, res, next));
router.patch('/', (req: Request, res: Response, next: NextFunction) => settings.updateSettings(req, res, next));
router.patch('/profile', (req: Request, res: Response, next: NextFunction) => settings.updateProfile(req, res, next));
router.patch('/password', (req: Request, res: Response, next: NextFunction) => settings.changePassword(req, res, next));

export default router;
