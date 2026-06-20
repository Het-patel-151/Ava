import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { analyzeDocument } from '../services/openai.service';
import path from 'path';
import fs from 'fs';

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const { conversationId } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const file = await prisma.uploadedFile.create({
      data: { name: req.file.filename, originalName: req.file.originalname, url: fileUrl, mimeType: req.file.mimetype, size: req.file.size, userId: req.user!.id, conversationId },
    });

    analyzeDocument(file.id, req.file.path, req.file.mimetype).catch(console.error);
    res.status(201).json({ success: true, data: file });
  } catch (err) { next(err); }
};

export const getFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [files, total] = await Promise.all([
      prisma.uploadedFile.findMany({ where: { userId: req.user!.id }, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.uploadedFile.count({ where: { userId: req.user!.id } }),
    ]);
    res.json({ success: true, data: files, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = await prisma.uploadedFile.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!file) throw new AppError('File not found', 404);
    const filePath = path.join(process.cwd(), 'uploads', file.name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.uploadedFile.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'File deleted' });
  } catch (err) { next(err); }
};
