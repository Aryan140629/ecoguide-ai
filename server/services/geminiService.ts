import { GoogleGenAI } from '@google/genai';

interface ChatMsg {
  role: string;
  content: string;
}

export class GeminiService {
  private ai: GoogleGenAI | null;

  constructor() {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ WARNING: GEMINI_API_KEY is not set. API will fail.');
      this.ai = null;
    } else {
      this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }
  }

  async *generateChatStream(message: string, context: string, history: ChatMsg[]) {
    if (!this.ai) {
      throw new Error('Gemini API key is not configured');
    }

    const formattedHistory = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const responseStream = await this.ai.models.generateContentStream({
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
        yield chunk.text;
      }
    }
  }
}

export const geminiService = new GeminiService();
