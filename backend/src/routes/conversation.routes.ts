import { Router, Request, Response, NextFunction } from 'express';
import * as conv from '../controllers/conversation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => conv.getConversations(req, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => conv.getConversation(req, res, next));
router.post('/', (req: Request, res: Response, next: NextFunction) => conv.createConversation(req, res, next));
router.patch('/:id', (req: Request, res: Response, next: NextFunction) => conv.updateConversation(req, res, next));
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => conv.deleteConversation(req, res, next));

export default router;
