'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface ChatMessage {
  id: string; conversation_id: string; sender_id: string; content: string;
  type: string; image_url: string | null; edited: boolean; created_at: string;
  reactions?: { emoji: string; count: number; user_reacted: boolean }[];
}

interface Participant { user_id: string; display_name: string; last_read_at: string | null; }

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🙏', '🔥', '💯'];

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
  const [typing, setTyping] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { user } = useAppStore();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Load conversation
  useEffect(() => {
    if (!conversationId || !user) return;

    const loadConversation = async () => {
      const { data: conv } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
      if (conv?.name) setConversationName(conv.name);

      // Get participants
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id, last_read_at, profiles!conversation_members_user_id_fkey(display_name)')
        .eq('conversation_id', conversationId);

      if (members) {
        const parts = members.map((m: any) => ({ user_id: m.user_id, display_name: m.profiles?.display_name || 'Unknown', last_read_at: m.last_read_at }));
        setParticipants(parts);
        if (!conv?.name && parts.length === 2) {
          const other = parts.find((p: any) => p.user_id !== user.id);
          if (other) setConversationName(other.display_name);
        }
      }

      // Get messages with reactions
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (msgs) {
        // Load reactions for these messages
        const msgIds = msgs.map(m => m.id);
        const { data: allReactions } = await supabase
          .from('message_reactions')
          .select('*')
          .in('message_id', msgIds);

        const enriched = msgs.map(msg => {
          const msgReactions = (allReactions || []).filter(r => r.message_id === msg.id);
          const emojiMap: Record<string, { count: number; user_reacted: boolean }> = {};
          msgReactions.forEach(r => {
            if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, user_reacted: false };
            emojiMap[r.emoji].count++;
            if (r.user_id === user.id) emojiMap[r.emoji].user_reacted = true;
          });
          return { ...msg, reactions: Object.entries(emojiMap).map(([emoji, data]) => ({ emoji, ...data })) };
        });
        setMessages(enriched);
      }

      setLoading(false);

      // Mark as read
      await supabase.from('conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', user.id);
    };

    loadConversation();

    // Real-time: new messages
    const msgChannel = supabase.channel(`chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload: any) => {
          const newMsg = { ...payload.new, reactions: [] };
          setMessages(prev => { if (prev.some(m => m.id === newMsg.id)) return prev; return [...prev, newMsg]; });
        })
      .subscribe();

    // Real-time: typing indicators
    const typingChannel = supabase.channel(`typing:${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_indicators', filter: `conversation_id=eq.${conversationId}` },
        () => { refreshTyping(); })
      .subscribe();

    const refreshTyping = async () => {
      const fiveSecsAgo = new Date(Date.now() - 5000).toISOString();
      const { data } = await supabase.from('typing_indicators').select('user_id').eq('conversation_id', conversationId).gte('updated_at', fiveSecsAgo).neq('user_id', user.id);
      if (data) {
        const names = data.map(d => participants.find(p => p.user_id === d.user_id)?.display_name || '').filter(Boolean);
        setTyping(names);
      }
    };

    return () => { supabase.removeChannel(msgChannel); supabase.removeChannel(typingChannel); };
  }, [conversationId, user, supabase]);

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (!conversationId || !user) return;
    supabase.from('typing_indicators').upsert({ conversation_id: conversationId, user_id: user.id, updated_at: new Date().toISOString() });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      supabase.from('typing_indicators').delete().eq('conversation_id', conversationId).eq('user_id', user.id);
    }, 3000);
  }, [conversationId, user, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imageFile) || !user || !conversationId) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    let imageUrl = null;
    if (imageFile) {
      const path = `${user.id}/chat-${Date.now()}.${imageFile.name.split('.').pop()}`;
      await supabase.storage.from('media').upload(path, imageFile);
      const { data } = supabase.storage.from('media').getPublicUrl(path);
      imageUrl = data.publicUrl;
      setImageFile(null);
      setImagePreview(null);
    }

    // Optimistic
    const optimistic: ChatMessage = { id: `temp-${Date.now()}`, conversation_id: conversationId, sender_id: user.id, content: content || (imageUrl ? '📷 Image' : ''), type: imageUrl ? 'image' : 'text', image_url: imageUrl, edited: false, created_at: new Date().toISOString(), reactions: [] };
    setMessages(prev => [...prev, optimistic]);

    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, content: content || '📷 Image', type: imageUrl ? 'image' : 'text', image_url: imageUrl });

    // Clear typing
    supabase.from('typing_indicators').delete().eq('conversation_id', conversationId).eq('user_id', user.id);
    setSending(false);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const msg = messages.find(m => m.id === messageId);
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.user_reacted);

    if (existing) {
      await supabase.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', user.id).eq('emoji', emoji);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: (m.reactions || []).map(r => r.emoji === emoji ? { ...r, count: r.count - 1, user_reacted: false } : r).filter(r => r.count > 0) } : m));
    } else {
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: [...(m.reactions || []).filter(r => r.emoji !== emoji), { emoji, count: ((m.reactions || []).find(r => r.emoji === emoji)?.count || 0) + 1, user_reacted: true }] } : m));
    }
    setShowReactions(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getParticipantName = (senderId: string) => {
    if (senderId === user?.id) return 'You';
    return participants.find(p => p.user_id === senderId)?.display_name || 'Unknown';
  };

  const isRead = (msg: ChatMessage) => {
    return participants.some(p => p.user_id !== user?.id && p.last_read_at && new Date(p.last_read_at) >= new Date(msg.created_at));
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const filteredMessages = searchQuery ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())) : messages;

  if (!conversationId) return <div className="text-center py-12"><p className="text-gray-500">No conversation selected.</p><button onClick={() => router.push('/connect')} className="btn-teal mt-4">Back</button></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] -mx-4 -my-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950">
        <button onClick={() => router.push('/connect')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800" aria-label="Back">←</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-harbor-800 dark:text-white truncate">{conversationName || 'Chat'}</h2>
          <p className="text-[10px] text-gray-400">
            {typing.length > 0 ? <span className="text-teal-500 animate-pulse-soft">{typing.join(', ')} typing...</span> : `${participants.length} member${participants.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowSearch(!showSearch)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800 text-sm">🔍</button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-harbor-800">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field !py-2 text-sm" placeholder="Search messages..." autoFocus />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="flex gap-2"><div className="skeleton w-8 h-8 rounded-full" /><div className="skeleton h-10 w-48 rounded-xl" /></div>)
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12"><p className="text-4xl mb-2">💬</p><p className="text-sm text-gray-500">{searchQuery ? 'No messages match' : 'Say hello!'}</p></div>
        ) : (
          filteredMessages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            const showName = !isMe && (i === 0 || filteredMessages[i - 1].sender_id !== msg.sender_id);
            const showTime = i === 0 || new Date(msg.created_at).getTime() - new Date(filteredMessages[i-1].created_at).getTime() > 300000;

            return (
              <div key={msg.id}>
                {showTime && <p className="text-[10px] text-gray-400 text-center my-2">{new Date(msg.created_at).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
                <div className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                  {showName && <span className="text-[10px] text-gray-400 mb-0.5 mx-2">{getParticipantName(msg.sender_id)}</span>}
                  <div className="relative group max-w-[80%]">
                    <div className={cn('px-3 py-2 rounded-2xl text-sm', isMe ? 'bg-teal-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-harbor-800 text-harbor-800 dark:text-gray-200 rounded-bl-sm')}>
                      {msg.image_url && <img src={msg.image_url} alt="" className="rounded-lg max-h-48 mb-1 cursor-pointer" onClick={() => window.open(msg.image_url!, '_blank')} />}
                      {msg.content && msg.content !== '📷 Image' && <p>{msg.content}</p>}
                      {msg.edited && <span className="text-[9px] opacity-60 ml-1">(edited)</span>}
                    </div>

                    {/* Reaction button (hover) */}
                    <button onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)} className="absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-harbor-900 rounded-full shadow px-1.5 py-0.5 text-[10px]">😊+</button>

                    {/* Reaction picker */}
                    {showReactions === msg.id && (
                      <div className="absolute bottom-full mb-1 right-0 bg-white dark:bg-harbor-900 rounded-full shadow-lg border border-gray-200 dark:border-harbor-700 px-2 py-1 flex gap-1 z-10">
                        {QUICK_REACTIONS.map(emoji => (
                          <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="text-lg hover:scale-125 transition-transform">{emoji}</button>
                        ))}
                      </div>
                    )}

                    {/* Display reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {msg.reactions.map(r => (
                          <button key={r.emoji} onClick={() => handleReaction(msg.id, r.emoji)} className={cn('text-[11px] px-1.5 py-0.5 rounded-full border transition-colors', r.user_reacted ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700' : 'bg-gray-50 dark:bg-harbor-800 border-gray-200 dark:border-harbor-700')}>
                            {r.emoji} {r.count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Read receipt + time */}
                  <div className="flex items-center gap-1 mx-2 mt-0.5">
                    <span className="text-[9px] text-gray-400">{formatTime(msg.created_at)}</span>
                    {isMe && <span className="text-[9px]">{isRead(msg) ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-harbor-800">
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-harbor-800 bg-white dark:bg-harbor-950">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-harbor-800 text-lg">📷</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); sendTyping(); }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full bg-gray-100 dark:bg-harbor-900 border-0 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            disabled={sending}
          />

          <button type="submit" disabled={(!input.trim() && !imageFile) || sending} className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 transition-colors disabled:opacity-50">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
