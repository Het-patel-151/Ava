import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/database';
import {
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  revokeRefreshToken, saveRefreshToken, blacklistToken,
} from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered', 409);

    const hashedPassword = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, emailVerifyToken: verifyToken,
        settings: { create: {} }, subscription: { create: {} } },
      select: { id: true, name: true, email: true, role: true, emailVerified: true },
    });

    await sendVerificationEmail(email, name, verifyToken);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
    await saveRefreshToken(user.id, refreshToken, req.headers['user-agent'], req.ip);

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ success: true, data: { user, accessToken } });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new AppError('Invalid credentials', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', 401);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
    await saveRefreshToken(user.id, refreshToken, req.headers['user-agent'], req.ip);

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

    const { password: _, emailVerifyToken: __, resetPasswordToken: ___, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, accessToken } });
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies?.refreshToken;
    if (token) await blacklistToken(token);
    if (refreshToken) await revokeRefreshToken(refreshToken);
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

export const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) throw new AppError('Refresh token required', 401);

    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) throw new AppError('Invalid or expired refresh token', 401);

    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) throw new AppError('User not found', 401);

    await revokeRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
    await saveRefreshToken(user.id, newRefreshToken, req.headers['user-agent'], req.ip);

    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) { next(err); }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findFirst({ where: { emailVerifyToken: req.params.token } });
    if (!user) throw new AppError('Invalid verification token', 400);
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerifyToken: null } });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) { next(err); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: { resetPasswordToken: resetToken, resetPasswordExpires: expires } });
      await sendPasswordResetEmail(email, user.name, resetToken);
    }
    res.json({ success: true, message: 'If the email exists, a reset link has been sent' });
  } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({ where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } } });
    if (!user) throw new AppError('Invalid or expired reset token', 400);
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, avatar: true, bio: true, location: true, role: true, emailVerified: true, createdAt: true, settings: true, subscription: true },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
