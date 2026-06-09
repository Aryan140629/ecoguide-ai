export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export async function* sendChatMessage(
  message: string,
  context: string,
  history: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const recentHistory = history.slice(-10); // Keep only last 10 messages to limit token usage

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      context,
      history: recentHistory,
    }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to connect to AI Coach';
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // Ignore JSON parse error if response is not JSON
    }
    throw new Error(errorMsg);
  }

  if (!response.body) {
    throw new Error('No response body received');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      
      // Keep the last partial line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          if (dataStr === '[DONE]') {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.text) {
              yield data.text;
            }
          } catch {
            // If it's a parsing error for a partial chunk, we might want to log it,
            // but typical SSE chunks from our server will be full JSON objects.
            console.warn('Failed to parse SSE chunk:', dataStr);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
