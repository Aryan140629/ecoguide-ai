import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../server';
import { geminiService } from '../services/geminiService';

vi.mock('../services/geminiService', () => ({
  geminiService: {
    generateChatStream: vi.fn(),
  },
}));

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    message: 'Hello',
    context: 'You are an AI assistant.',
    history: [{ role: 'user', content: 'Hi' }],
  };

  it('should return 400 if validation fails (missing message)', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ context: 'context', history: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('should return 400 if validation fails (invalid history format)', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ ...validPayload, history: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid input');
  });

  it('should successfully stream chat response', async () => {
    // Mock the async generator
    async function* mockGenerator() {
      yield 'Hello ';
      yield 'World';
    }
    vi.spyOn(geminiService, 'generateChatStream').mockReturnValue(mockGenerator());

    const res = await request(app)
      .post('/api/chat')
      .send(validPayload);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('data: {"text":"Hello "}');
    expect(res.text).toContain('data: {"text":"World"}');
    expect(res.text).toContain('data: [DONE]');
  });

  it('should handle Gemini API failure securely (500 error)', async () => {
    vi.spyOn(geminiService, 'generateChatStream').mockImplementation(() => {
      throw new Error('API Key invalid');
    });

    const res = await request(app)
      .post('/api/chat')
      .send(validPayload);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
    // Ensure the original error message "API Key invalid" is not leaked
    expect(res.body.details).toBeUndefined();
  });

  it('should enforce rate limiting and return 429 after limit', async () => {
    const ip = '192.168.1.1';
    
    // Fill the rate limit quota (max 10)
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/chat').set('X-Forwarded-For', ip).send(validPayload);
    }

    // 11th request should fail
    const res = await request(app).post('/api/chat').set('X-Forwarded-For', ip).send(validPayload);
    
    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Too many requests');
  });
});
