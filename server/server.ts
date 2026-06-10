import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

// ✅ FIX: Render-compatible port binding
const PORT = process.env.PORT || 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ WARNING: GEMINI_API_KEY is not set. API will fail.');
}

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Middleware
app.use(helmet());

// ✅ FIX: safer CORS handling for production
const ALLOWED_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173';

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '100kb' }));

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 1000);

function rateLimit(req: Request, res: Response, next: () => void) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;

  const record = rateLimitMap.get(ip) || {
    count: 0,
    resetTime: now + windowMs
  };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count++;
  rateLimitMap.set(ip, record);

  if (record.count > maxRequests) {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
    return;
  }

  next();
}

app.post('/api/chat', rateLimit, async (req: Request, res: Response) => {
  try {
    const { message, context, history } = req.body as {
      message?: unknown;
      context?: unknown;
      history?: unknown;
    };

    // Validation
    if (!message || typeof message !== 'string' || message.length > 5000) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    if (!context || typeof context !== 'string' || context.length > 20000) {
      return res.status(400).json({ error: 'Invalid context' });
    }

    if (!Array.isArray(history)) {
      return res.status(400).json({ error: 'Invalid history' });
    }

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    interface ChatMsg {
      role: string;
      content: string;
    }

    const formattedHistory = (history as ChatMsg[]).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: context,
        temperature: 0.7
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(
          `data: ${JSON.stringify({ text: chunk.text })}\n\n`
        );
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API Error:', error);

    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.write(
      `data: ${JSON.stringify({
        error: 'Internal server error during streaming'
      })}\n\n`
    );

    res.end();
  }
});

// ✅ FIX: Render-safe listen
app.listen(PORT, () => {
  console.log(`🤖 EcoGuide AI server running on port ${PORT}`);
});