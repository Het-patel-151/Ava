import { Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from '../config/socket';
import { synthesizeSpeech, streamChatCompletion, transcribeAudio } from './openai.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const handleVoiceEvents = (io: SocketServer, socket: AuthenticatedSocket) => {
  socket.on('voice:start', () => {
    logger.info(`Voice session started: ${socket.userId}`);
    socket.emit('voice:ready', { message: 'Voice session started' });
  });

  socket.on('voice:audio', async (audioData: { buffer: ArrayBuffer; conversationId?: string }) => {
    try {
      const tempPath = path.join(process.cwd(), 'uploads', `temp_${uuidv4()}.webm`);
      fs.writeFileSync(tempPath, Buffer.from(audioData.buffer));

      const transcript = await transcribeAudio(tempPath);
      fs.unlinkSync(tempPath);
      if (!transcript.trim()) return;

      socket.emit('voice:transcript', { text: transcript, final: true });

      const conversationId = audioData.conversationId;
      let systemPrompt = 'You are AVA, a helpful and friendly AI voice assistant. Keep responses concise and conversational.';

      if (conversationId) {
        const conversation = await prisma.conversation.findFirst({
          where: { id: conversationId, userId: socket.userId },
          include: { agent: true },
        });
        if (conversation?.agent?.systemPrompt) systemPrompt = conversation.agent.systemPrompt;
      }

      const history = conversationId
        ? await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' }, take: 10 })
        : [];

      let fullResponse = '';
      socket.emit('voice:thinking', { status: true });

      await streamChatCompletion(
        systemPrompt,
        [
          ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user' as const, content: transcript },
        ],
        (chunk) => { fullResponse += chunk; }
      );

      socket.emit('voice:thinking', { status: false });
      socket.emit('voice:response', { text: fullResponse });

      const settings = await prisma.userSettings.findUnique({ where: { userId: socket.userId } });
      const voice = (settings?.voiceId || 'nova') as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      const audioBuffer = await synthesizeSpeech(fullResponse, voice);
      socket.emit('voice:audio_response', { audio: audioBuffer, text: fullResponse });

      if (conversationId) {
        await prisma.message.createMany({
          data: [
            { conversationId, userId: socket.userId, role: 'user', content: transcript, type: 'VOICE' },
            { conversationId, userId: socket.userId, role: 'assistant', content: fullResponse, type: 'VOICE' },
          ],
        });
      }

      await prisma.analytics.upsert({
        where: { userId_date: { userId: socket.userId, date: new Date(new Date().toDateString()) } },
        update: { voiceSessions: { increment: 1 }, messages: { increment: 2 } },
        create: { userId: socket.userId, date: new Date(new Date().toDateString()), voiceSessions: 1, messages: 2 },
      });
    } catch (err) {
      logger.error('Voice processing error:', err);
      socket.emit('voice:error', { message: 'Failed to process voice input' });
    }
  });

  socket.on('voice:stop', () => {
    socket.emit('voice:stopped', { message: 'Voice session ended' });
  });
};
