'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: string;
  created_at: string;
}

interface Participant {
  user_id: string;
  profiles?: { display_name: string; avatar_url: string | null } | { display_name: string; avatar_url: string | null }[] | null;
}

export default function ChatThreadPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="skeleton w-40 h-6 rounded-lg" /></div>}>
      <ChatThreadPage />
    </Suspense>
  );
}

function ChatThreadPage() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('id');
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [conversationName, setConversationName] = useState('');

  const { user } = useAppStore();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation data
  useEffect(() => {
    if (!conversationId || !user) return;

    const loadConversation = async () => {
      // Get conversation info
      const { data: conv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (conv?.name) {
        setConversationName(conv.name);
      }

      // Get participants
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id, profiles!conversation_members_user_id_fkey(display_name, avatar_url)')
        .eq('conversation_id', conversationId);

      if (members) {
        setParticipants(members);
        // For direct chats, show the other person's name
        if (!conv?.name && members.length === 2) {
          const other = members.find((m) => m.user_id !== user.id);
          if (other?.profiles) {
            setConversationName((other.profiles as any).display_name);
          }
        }
      }

      // Get messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (msgs) {
        setMessages(msgs);
      }

      setLoading(false);

      // Mark as read
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
    };

    loadConversation();

    // Real-time subscription
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !conversationId) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      type: 'text',
    });

    if (error) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    }

    setSending(false);
  };

  const getParticipantName = (senderId: string): string => {
    if (senderId === user?.id) return 'You';
    const p = participants.find((m) => m.user_id === senderId);
    return (p?.profiles as any)?.display_name ?? 'Unknown';
  };

  const formatTime = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (!conversationId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No conversation selected.</p>
        <button onClick={() => router.push('/connect')} className="btn-teal mt-4">
          Back to messages
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mx-4 -my-4">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950">
        <button
          onClick={() => router.push('/connect')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800"
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-harbor-800 dark:text-white truncate">
            {conversationName || 'Chat'}
          </h2>
          <p className="text-xs text-gray-400">
            {participants.length} {participants.length === 1 ? 'person' : 'people'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="skeleton h-10 w-48 rounded-xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            const showName = !isMe && (
              i === 0 || messages[i - 1].sender_id !== msg.sender_id
            );

            return (
              <div
                key={msg.id}
                className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}
              >
                {showName && (
                  <span className="text-xs text-gray-400 mb-0.5 ml-1">
                    {getParticipantName(msg.sender_id)}
                  </span>
                )}
                <div
                  className={cn(
                    'max-w-[80%] px-3 py-2 rounded-2xl text-sm',
                    isMe
                      ? 'bg-teal-500 text-white rounded-br-sm'
                      : 'bg-gray-100 dark:bg-harbor-800 text-harbor-800 dark:text-gray-200 rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 mx-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-harbor-900 border-0 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            aria-label="Message input"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-11 h-11 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
