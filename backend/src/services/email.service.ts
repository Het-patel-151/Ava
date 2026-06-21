import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #111; border-radius: 16px; overflow: hidden; border: 1px solid #222; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .body { padding: 32px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; margin: 24px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #222; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>AVA</h1><p style="margin:8px 0 0;opacity:0.8">AI Voice Assistant</p></div>
    <div class="body">${content}</div>
    <div class="footer"><p>© ${new Date().getFullYear()} AVA. All rights reserved.</p></div>
  </div>
</body>
</html>`;

export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<void> => {
  const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`;
  const html = baseTemplate(`
    <h2>Verify your email</h2>
    <p>Hi ${name},</p>
    <p>Thanks for signing up! Please verify your email address to get started.</p>
    <a href="${verifyUrl}" class="button">Verify Email</a>
    <p style="color:#666;font-size:13px">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
  `);

  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to: email, subject: 'Verify your AVA account', html });
  } catch (err) {
    logger.error('Failed to send verification email:', err);
  }
};

export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`;
  const html = baseTemplate(`
    <h2>Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click below to create a new one.</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p style="color:#666;font-size:13px">This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
  `);

  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to: email, subject: 'Reset your AVA password', html });
  } catch (err) {
    logger.error('Failed to send reset email:', err);
  }
};
