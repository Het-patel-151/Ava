import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { prisma } from './config/database';
import { redis } from './config/redis';
import { initializeSocket } from './config/socket';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import conversationRoutes from './routes/conversation.routes';
import messageRoutes from './routes/message.routes';
import agentRoutes from './routes/agent.routes';
import fileRoutes from './routes/file.routes';
import analyticsRoutes from './routes/analytics.routes';
import settingsRoutes from './routes/settings.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Security Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// Static Files
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = parseInt(process.env.PORT || '5000');

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected');

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  });
});

bootstrap();

export { app, server };
