import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { streamChatCompletion } from '../services/openai.service';

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const conv = await prisma.conversation.findFirst({ where: { id: conversationId, userId: req.user!.id } });
    if (!conv) throw new AppError('Conversation not found', 404);
    const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, include: { reactions: true } });
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'TEXT' } = req.body;

    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.user!.id },
      include: { agent: true },
    });
    if (!conv) throw new AppError('Conversation not found', 404);

    await prisma.message.create({ data: { conversationId, userId: req.user!.id, role: 'user', content, type } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    if (!conv.title || conv.title === 'New Conversation') {
      await prisma.conversation.update({ where: { id: conversationId }, data: { title: content.slice(0, 50) + (content.length > 50 ? '...' : '') } });
    }

    const history = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 20 });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const systemPrompt = conv.agent?.systemPrompt || 'You are AVA, a helpful AI assistant.';
    let fullResponse = '';

    await streamChatCompletion(
      systemPrompt,
      history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      (chunk) => { fullResponse += chunk; res.write(`data: ${JSON.stringify({ chunk })}\n\n`); },
      conv.agent?.model || 'gpt-4o'
    );

    const aiMessage = await prisma.message.create({
      data: { conversationId, userId: req.user!.id, role: 'assistant', content: fullResponse, type: 'TEXT' },
    });

    await prisma.analytics.upsert({
      where: { userId_date: { userId: req.user!.id, date: new Date(new Date().toDateString()) } },
      update: { messages: { increment: 2 } },
      create: { userId: req.user!.id, date: new Date(new Date().toDateString()), messages: 2 },
    });

    res.write(`data: ${JSON.stringify({ done: true, messageId: aiMessage.id })}\n\n`);
    res.end();
  } catch (err) { next(err); }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const msg = await prisma.message.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!msg) throw new AppError('Message not found', 404);
    await prisma.message.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) { next(err); }
};

export const addReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emoji } = req.body;
    const reaction = await prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId: req.params.id, userId: req.user!.id, emoji } },
      update: {},
      create: { messageId: req.params.id, userId: req.user!.id, emoji },
    });
    res.json({ success: true, data: reaction });
  } catch (err) { next(err); }
};
