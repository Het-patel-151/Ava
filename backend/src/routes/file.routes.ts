import { Router, Request, Response, NextFunction } from 'express';
import * as file from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();
router.use(authenticate);

router.get('/', (req: Request, res: Response, next: NextFunction) => file.getFiles(req, res, next));
router.post('/upload', upload.single('file'), (req: Request, res: Response, next: NextFunction) => file.uploadFile(req, res, next));
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => file.deleteFile(req, res, next));

export default router;
