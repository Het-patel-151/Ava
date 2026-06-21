import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: result.error.flatten().fieldErrors,
    });
    return;
  }
  req.body = result.data;
  next();
};

// Schemas
export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase and number'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(32000),
  type: z.enum(['TEXT', 'VOICE', 'FILE', 'IMAGE']).optional(),
});

export const agentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  systemPrompt: z.string().min(1).max(4000),
  avatar: z.string().url().optional(),
  personality: z.string().max(200).optional(),
  model: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']).optional(),
  isPublic: z.boolean().optional(),
});
