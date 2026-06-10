import { Request, Response, NextFunction } from 'express';
import { geminiService } from '../services/geminiService';

export async function handleChatPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, context, history } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = geminiService.generateChatStream(message, context, history);

    for await (const chunk of await stream) {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    next(error);
  }
}
