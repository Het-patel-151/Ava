import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    const unread = await prisma.notification.count({ where: { userId: req.user!.id, read: false } });
    res.json({ success: true, data: notifications, unread });
  } catch (err) { next(err); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, ...(req.params.id !== 'all' && { id: req.params.id }) },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};
