import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getAgents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { OR: [{ userId: req.user!.id }, { isPublic: true }] },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: agents });
  } catch (err) { next(err); }
};

export const getAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, OR: [{ userId: req.user!.id }, { isPublic: true }] },
    });
    if (!agent) throw new AppError('Agent not found', 404);
    res.json({ success: true, data: agent });
  } catch (err) { next(err); }
};

export const createAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, systemPrompt, avatar, personality, model, isPublic } = req.body;
    const agent = await prisma.agent.create({
      data: { name, description, systemPrompt, avatar, personality, model, isPublic: isPublic ?? false, userId: req.user!.id },
    });
    res.status(201).json({ success: true, data: agent });
  } catch (err) { next(err); }
};

export const updateAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!agent) throw new AppError('Agent not found', 404);
    const updated = await prisma.agent.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const deleteAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!agent) throw new AppError('Agent not found', 404);
    if (agent.isDefault) throw new AppError('Cannot delete default agent', 400);
    await prisma.agent.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Agent deleted' });
  } catch (err) { next(err); }
};
