import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
};

export const blacklistToken = async (token: string): Promise<void> => {
  const decoded = jwt.decode(token) as { exp: number } | null;
  if (decoded?.exp) {
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redis.setex(`blacklist:${token}`, ttl, '1');
    }
  }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
};

export const saveRefreshToken = async (
  userId: string,
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: { userId, refreshToken, userAgent, ipAddress, expiresAt },
  });
};

export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  await prisma.session.deleteMany({ where: { refreshToken } });
};

export const generateEmailToken = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};
