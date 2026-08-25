'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ToolResultCard } from './tool-result-card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_results?: Array<{ name: string; result: any }>;
  rail_triggered?: boolean;
  error?: boolean;
}

interface MiChatProps {
  conversationId?: string;
}

export function MiChat({ conversationId }: MiChatProps) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey, I'm Mi. I help you navigate MiLyfe — money, learning, resources, governance, safety. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    if (!conversationId || historyLoaded) return;

    async function loadHistory() {
      try {
        const res = await fetch(`/api/mi/history?conversationId=${conversationId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          }
        }
      } catch {
        // Silent — history is best-effort
      }
      setHistoryLoaded(true);
    }

    loadHistory();
  }, [conversationId, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    const allMessages = [...messages, userMessage].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/mi/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, conversationId, currentPath: pathname }),
      });

      // Check for non-streaming JSON response (rail triggered or error)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.content,
          rail_triggered: data.rail_triggered,
          error: data.error,
        }]);
        setIsLoading(false);
        return;
      }

      // Handle SSE streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No stream');

      const decoder = new TextDecoder();
      let fullContent = '';
      const toolResults: Array<{ name: string; result: any }> = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
              setStreamingContent(fullContent);
            }
            if (parsed.tool_result) {
              toolResults.push(parsed.tool_result);
            }
            if (parsed.error) {
              fullContent += '\n\n(Connection interrupted)';
            }
          } catch {
            // Skip
          }
        }
      }

      // Finalize message
      setStreamingContent('');
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        tool_results: toolResults.length > 0 ? toolResults : undefined,
      }]);
    } catch {
      setStreamingContent('');
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Sorry, I couldn't connect. Try again in a moment.",
        error: true,
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, conversationId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : msg.rail_triggered
                    ? 'border-2 border-red-300 bg-red-50 text-red-900'
                    : msg.error
                      ? 'bg-yellow-50 border border-yellow-200 text-yellow-900'
                      : 'bg-muted text-foreground'
              }`}
            >
              {msg.role === 'assistant' && (
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {msg.rail_triggered ? '🛡️ Safety' : '🤖 Mi'}
                </p>
              )}
              {/* Tool results */}
              {msg.tool_results?.map((tr, i) => (
                <ToolResultCard key={i} toolName={tr.name} result={tr.result} />
              ))}
              {msg.content && (
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming content */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-muted px-4 py-2.5">
              <p className="mb-1 text-xs font-medium text-muted-foreground">🤖 Mi</p>
              <div className="whitespace-pre-wrap text-sm">{streamingContent}<span className="animate-pulse">▊</span></div>
            </div>
          </div>
        )}

        {/* Loading (before stream starts) */}
        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-4 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">🤖 Mi</p>
              <div className="flex gap-1 pt-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Mi anything..."
            rows={1}
            className="flex-1 resize-none rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Mi is an AI helper — not a person, not a lawyer, not a doctor.
        </p>
      </div>
    </div>
  );
}
