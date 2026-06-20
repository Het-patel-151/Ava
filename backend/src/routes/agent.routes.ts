import { Router, Request, Response, NextFunction } from 'express';
import * as agent from '../controllers/agent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, agentSchema } from '../middleware/validate';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => agent.getAgents(req, res, next));
router.get('/:id', (req: Request, res: Response, next: NextFunction) => agent.getAgent(req, res, next));
router.post('/', validate(agentSchema), (req: Request, res: Response, next: NextFunction) => agent.createAgent(req, res, next));
router.patch('/:id', (req: Request, res: Response, next: NextFunction) => agent.updateAgent(req, res, next));
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => agent.deleteAgent(req, res, next));

export default router;
