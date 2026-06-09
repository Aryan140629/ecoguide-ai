import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessage } from '../../services/chatService';

describe('Chat Service', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  it('should throw an error if the fetch fails with non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error limit' }),
    });

    try {
      // Consume the generator
      const gen = sendChatMessage('hello', 'context', []);
      await gen.next();
      expect.unreachable();
    } catch (err: unknown) {
      expect((err as Error).message).toBe('Server error limit');
    }
  });

  it('should stream data correctly from mocked response body', async () => {
    // We mock a readable stream
    const mockChunks = [
      'data: {"text":"hello "}\n\n',
      'data: {"text":"world"}\n\ndata: [DONE]\n\n'
    ];
    let chunkIndex = 0;

    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (chunkIndex < mockChunks.length) {
          const value = new TextEncoder().encode(mockChunks[chunkIndex++]);
          return Promise.resolve({ done: false, value });
        }
        return Promise.resolve({ done: true });
      }),
      releaseLock: vi.fn(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    const gen = sendChatMessage('hello', 'context', []);
    const results = [];
    for await (const chunk of gen) {
      results.push(chunk);
    }

    expect(results).toEqual(['hello ', 'world']);
    expect(mockReader.releaseLock).toHaveBeenCalled();
  });

  it('should handle SSE parse errors gracefully without failing the stream', async () => {
    const mockChunks = [
      'data: invalid_json\n\n',
      'data: {"text":"hello"}\n\ndata: [DONE]\n\n'
    ];
    let chunkIndex = 0;

    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        if (chunkIndex < mockChunks.length) {
          const value = new TextEncoder().encode(mockChunks[chunkIndex++]);
          return Promise.resolve({ done: false, value });
        }
        return Promise.resolve({ done: true });
      }),
      releaseLock: vi.fn(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => mockReader,
      },
    });

    const gen = sendChatMessage('hello', 'context', []);
    const results = [];
    for await (const chunk of gen) {
      results.push(chunk);
    }

    // It should ignore the invalid JSON and return the valid one
    expect(results).toEqual(['hello']);
  });
});
