import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Server Error:', err instanceof Error ? err.message : err);
  }

  if (!res.headersSent) {
    res.setHeader('Content-Type', 'application/json');
    if (err && typeof err === 'object' && 'name' in err && err.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation error', details: (err as any).errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.write(`data: ${JSON.stringify({ error: 'Internal server error during streaming' })}\n\n`);
    res.end();
  }
}
