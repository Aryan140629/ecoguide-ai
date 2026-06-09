import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProfile } from '../../hooks/useProfile';
import { useEmissions } from '../../hooks/useEmissions';
import { useGoals } from '../../hooks/useGoals';
import { buildCoachContext } from '../../services/contextBuilder';
import { sendChatMessage, type ChatMessage } from '../../services/chatService';

const SUGGESTIONS = [
  "What's my biggest impact area?",
  "How can I reduce my food emissions?",
  "Create a 30-day challenge for me",
];

export function AIChatPanel() {
  const { profile } = useProfile();
  const { footprint, recommendations } = useEmissions();
  const { goals } = useGoals();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi there! I'm your EcoGuide AI Coach. I've analyzed your footprint and I'm ready to help you reduce it. What would you like to focus on today?",
      timestamp: new Date().toISOString(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    const context = buildCoachContext(profile, footprint, recommendations, goals);

    try {
      const stream = sendChatMessage(userMessage.content, context, messages);
      
      let assistantMessage = '';
      const assistantMessageIndex = messages.length + 1;

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', timestamp: new Date().toISOString() }
      ]);

      for await (const chunk of stream) {
        assistantMessage += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            ...newMessages[assistantMessageIndex],
            content: assistantMessage,
          };
          return newMessages;
        });
      }
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to communicate with AI Coach.';
      setError(errorMessage);
      // Remove the empty assistant message if it failed immediately
      setMessages((prev) => {
        if (prev[prev.length - 1].role === 'assistant' && prev[prev.length - 1].content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  return (
    <Card className="flex flex-col h-[600px] max-h-[70vh] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3 text-white">
          <span className="text-2xl" aria-hidden="true">🤖</span>
          <div>
            <h3 className="font-bold text-lg leading-tight">AI Carbon Coach</h3>
            <p className="text-emerald-100 text-xs">Powered by Gemini</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/30">
              ⚠️ {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900 z-10">
        {messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(suggestion)}
                className="whitespace-nowrap text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your footprint..."
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white"
            disabled={isTyping}
            aria-label="Chat input message"
          />
          <Button 
            onClick={() => handleSend(inputValue)} 
            disabled={!inputValue.trim() || isTyping}
            className="rounded-xl px-5"
            aria-label="Send message"
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
}
