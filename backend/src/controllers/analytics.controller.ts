import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totals, dailyData, conversationCount, messageCount] = await Promise.all([
      prisma.analytics.aggregate({ where: { userId }, _sum: { messages: true, voiceSessions: true, tokensUsed: true } }),
      prisma.analytics.findMany({ where: { userId, date: { gte: thirtyDaysAgo } }, orderBy: { date: 'asc' } }),
      prisma.conversation.count({ where: { userId } }),
      prisma.message.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        totalConversations: conversationCount,
        totalMessages: messageCount,
        totalVoiceSessions: totals._sum.voiceSessions || 0,
        totalTokensUsed: totals._sum.tokensUsed || 0,
        dailyUsage: dailyData,
      },
    });
  } catch (err) { next(err); }
};
