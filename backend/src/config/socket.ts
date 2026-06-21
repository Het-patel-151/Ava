import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './database';
import { logger } from '../utils/logger';
import { handleVoiceEvents } from '../services/voice.service';
import { handleChatEvents } from '../services/chat.service';

export let io: SocketServer;

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: { id: string; name: string; email: string };
}

export function initializeSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        (socket.handshake.headers.authorization as string | undefined)?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) return next(new Error('User not found'));

      // Attach to socket as custom properties
      (socket as unknown as AuthenticatedSocket).userId = user.id;
      (socket as unknown as AuthenticatedSocket).user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as unknown as AuthenticatedSocket;
    logger.info(`Socket connected: ${socket.id} | User: ${socket.userId}`);

    socket.join(`user:${socket.userId}`);
    socket.emit('connected', { message: 'Connected to AVA', userId: socket.userId });

    handleVoiceEvents(io, socket);
    handleChatEvents(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  logger.info('🔌 Socket.IO initialized');
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  io?.to(`user:${userId}`).emit(event, data);
}
