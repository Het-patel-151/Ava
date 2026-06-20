import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from '../config/socket';
import { streamChatCompletion } from './openai.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const handleChatEvents = (io: SocketServer, socket: AuthenticatedSocket) => {
  socket.on('chat:message', async (data: { conversationId: string; content: string }) => {
    try {
      const { conversationId, content } = data;
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, userId: socket.userId },
        include: { agent: true },
      });
      if (!conversation) { socket.emit('chat:error', { message: 'Conversation not found' }); return; }

      await prisma.message.create({ data: { conversationId, userId: socket.userId, role: 'user', content, type: 'TEXT' } });

      const history = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 20 });
      const systemPrompt = conversation.agent?.systemPrompt || 'You are AVA, a helpful AI assistant.';
      let fullResponse = '';

      await streamChatCompletion(
        systemPrompt,
        history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        (chunk) => { fullResponse += chunk; socket.emit('chat:stream', { chunk, conversationId }); },
        conversation.agent?.model || 'gpt-4o'
      );

      const saved = await prisma.message.create({
        data: { conversationId, userId: socket.userId, role: 'assistant', content: fullResponse, type: 'TEXT' },
      });

      socket.emit('chat:stream_end', { conversationId, messageId: saved.id, content: fullResponse });
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    } catch (err) {
      logger.error('Chat socket error:', err);
      socket.emit('chat:error', { message: 'Failed to process message' });
    }
  });

  socket.on('chat:join', (conversationId: string) => socket.join(`conversation:${conversationId}`));
  socket.on('chat:leave', (conversationId: string) => socket.leave(`conversation:${conversationId}`));
};
