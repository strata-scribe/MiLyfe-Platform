'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface ChatMessage {
  role: 'user' | 'mi';
  content: string;
}

export function MiPanel() {
  const { miOpen } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'mi', content: "Hey! I'm Mi, your community assistant. I know Jacksonville resources, how $MLY works, and can help you navigate anything. What do you need?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch('/api/mi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-6),
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'mi', content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'mi', content: "Sorry, I'm having trouble connecting. Try again in a moment." }]);
    }

    setLoading(false);
  };

  if (!miOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-36 right-4 z-50 w-80 max-h-[28rem] bg-white dark:bg-harbor-950 rounded-2xl shadow-2xl border border-gray-100 dark:border-harbor-800 flex flex-col overflow-hidden',
        'animate-slide-up'
      )}
      role="dialog"
      aria-label="Mi assistant chat"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-harbor-800 to-teal-600 text-white">
        <h2 className="font-bold text-sm">Mi — Community Assistant</h2>
        <p className="text-xs text-white/70">Resources. Guidance. Always private.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed',
              msg.role === 'mi'
                ? 'bg-gray-100 dark:bg-harbor-800 text-gray-800 dark:text-gray-200'
                : 'bg-teal-500 text-white ml-auto'
            )}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="max-w-[85%] px-3 py-2 rounded-xl bg-gray-100 dark:bg-harbor-800">
            <span className="text-sm text-gray-400 animate-pulse-soft">Mi is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {['Find food', 'Need a job', 'Health help', 'How MLY works'].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-[11px] px-2.5 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 rounded-full whitespace-nowrap hover:bg-teal-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-harbor-800">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Mi anything..."
            className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-harbor-900 border-0 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            aria-label="Message to Mi"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
