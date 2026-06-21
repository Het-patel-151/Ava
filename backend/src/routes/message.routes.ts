import { Router, Request, Response, NextFunction } from 'express';
import * as msg from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, messageSchema } from '../middleware/validate';

const router = Router();
router.use(authenticate);

router.get('/conversation/:conversationId', (req: Request, res: Response, next: NextFunction) => msg.getMessages(req, res, next));
router.post('/conversation/:conversationId', validate(messageSchema), (req: Request, res: Response, next: NextFunction) => msg.sendMessage(req, res, next));
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => msg.deleteMessage(req, res, next));
router.post('/:id/reactions', (req: Request, res: Response, next: NextFunction) => msg.addReaction(req, res, next));

export default router;
