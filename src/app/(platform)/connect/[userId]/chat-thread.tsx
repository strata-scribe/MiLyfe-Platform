'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { sendMessage } from '@/lib/actions/messages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface OtherUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

interface Props {
  currentUserId: string;
  otherUser: OtherUser;
  initialMessages: Message[];
}

export function ChatThread({ currentUserId, otherUser, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Real-time subscription for incoming messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat-${otherUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${otherUser.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's directed to us
          if (newMsg.receiver_id === currentUserId) {
            setMessages((prev) => [...prev, newMsg]);
            // Mark as read
            supabase
              .from('messages')
              .update({ read: true })
              .eq('id', newMsg.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUser.id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setBody('');

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      body: trimmed,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const result = await sendMessage({
      receiver_id: otherUser.id,
      body: trimmed,
    });

    if (result.error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      toast.error(result.error);
    }

    setSending(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950 shrink-0">
        <Link
          href="/connect"
          className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-gray-100 dark:hover:bg-harbor-800 transition-colors"
          aria-label="Back to Connect"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <Avatar name={otherUser.display_name} src={otherUser.avatar_url} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-harbor-800 dark:text-white truncate">
            {otherUser.display_name}
          </p>
          <p className="text-xs text-gray-500 truncate">@{otherUser.username}</p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        aria-live="polite"
        aria-label="Message history"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400 text-center">
              No messages yet. Say hello to {otherUser.display_name}!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                    isMine
                      ? 'bg-teal-500 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-harbor-800 text-harbor-800 dark:text-gray-100 rounded-bl-md'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-1',
                      isMine ? 'text-teal-100' : 'text-gray-400'
                    )}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }).replace('about ', '')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950 shrink-0"
      >
        <Input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          aria-label="Message input"
          maxLength={2000}
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!body.trim() || sending}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
