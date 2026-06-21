import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, starred, pinned } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: Record<string, unknown> = { userId: req.user!.id, isArchived: false };
    if (search) where['title'] = { contains: search as string, mode: 'insensitive' };
    if (starred === 'true') where['isStarred'] = true;
    if (pinned === 'true') where['isPinned'] = true;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where, skip, take: Number(limit),
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 }, agent: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.conversation.count({ where }),
    ]);
    res.json({ success: true, data: conversations, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: 'asc' } }, agent: true },
    });
    if (!conversation) throw new AppError('Conversation not found', 404);
    res.json({ success: true, data: conversation });
  } catch (err) { next(err); }
};

export const createConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title = 'New Conversation', agentId } = req.body;
    const conversation = await prisma.conversation.create({
      data: { title, userId: req.user!.id, agentId },
      include: { agent: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json({ success: true, data: conversation });
  } catch (err) { next(err); }
};

export const updateConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!conv) throw new AppError('Conversation not found', 404);
    const { title, isStarred, isPinned, isArchived } = req.body;
    const updated = await prisma.conversation.update({
      where: { id: req.params.id },
      data: { ...(title && { title }), ...(isStarred !== undefined && { isStarred }), ...(isPinned !== undefined && { isPinned }), ...(isArchived !== undefined && { isArchived }) },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const deleteConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!conv) throw new AppError('Conversation not found', 404);
    await prisma.conversation.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) { next(err); }
};
