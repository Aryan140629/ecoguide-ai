import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().max(5000),
  context: z.string().max(20000),
  history: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
});

export function validateChatRequest(req: Request, res: Response, next: NextFunction) {
  try {
    req.body = chatRequestSchema.parse(req.body);
    next();
  } catch (error: any) {
    if (error && error.name === 'ZodError') {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    next(error);
  }
}
