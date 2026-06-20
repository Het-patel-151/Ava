import { Router, Request, Response, NextFunction } from 'express';
import * as auth from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../middleware/validate';

const router = Router();

router.post('/register', validate(registerSchema), (req: Request, res: Response, next: NextFunction) => auth.register(req, res, next));
router.post('/login', validate(loginSchema), (req: Request, res: Response, next: NextFunction) => auth.login(req, res, next));
router.post('/logout', authenticate, (req: Request, res: Response, next: NextFunction) => auth.logout(req, res, next));
router.post('/refresh', (req: Request, res: Response, next: NextFunction) => auth.refreshTokens(req, res, next));
router.get('/verify-email/:token', (req: Request, res: Response, next: NextFunction) => auth.verifyEmail(req, res, next));
router.post('/forgot-password', validate(forgotPasswordSchema), (req: Request, res: Response, next: NextFunction) => auth.forgotPassword(req, res, next));
router.post('/reset-password', validate(resetPasswordSchema), (req: Request, res: Response, next: NextFunction) => auth.resetPassword(req, res, next));
router.get('/me', authenticate, (req: Request, res: Response, next: NextFunction) => auth.getMe(req, res, next));

export default router;
