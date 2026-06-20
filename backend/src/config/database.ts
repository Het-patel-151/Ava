import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
  });
}

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error(`Prisma Error: ${e.message}`);
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
