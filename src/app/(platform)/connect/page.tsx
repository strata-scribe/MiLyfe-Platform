'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  participants: { id: string; display_name: string; avatar_url: string | null; online: boolean }[];
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  typing: string[];
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'system';
  file_url: string | null;
  file_name: string | null;
  reactions: { emoji: string; user_ids: string[] }[];
  read_by: string[];
  created_at: string;
  sender_name?: string;
}

type ConnectTab = 'messages' | 'groups' | 'new';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ConnectPage() {
  const [tab, setTab] = useState<ConnectTab>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New group form
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');

  // File sharing
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAppStore();

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadConversations() {
    setLoading(true);
    const supabase = createClient();
    if (user) {
      const { data } = await supabase.from('conversations').select('*').contains('participant_ids', [user.id]).order('last_message_at', { ascending: false });
      if (data) setConversations(data as any);
    }
    setLoading(false);
  }

  async function openConversation(convo: Conversation) {
    setActiveConvo(convo);
    const supabase = createClient();
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', convo.id).order('created_at', { ascending: true }).limit(50);
    if (data) setMessages(data as any);
    // Mark as read
    if (user) {
      await supabase.from('conversations').update({ unread_count: 0 }).eq('id', convo.id);
    }
  }

  async function sendMessage() {
    if (!user || !messageInput.trim() || !activeConvo) return;
    setSending(true);
    const supabase = createClient();
    const msg = {
      conversation_id: activeConvo.id, sender_id: user.id,
      content: messageInput.trim(), type: 'text' as const,
      reactions: [], read_by: [user.id], sender_name: user.display_name,
    };
    await supabase.from('messages').insert(msg);
    await supabase.from('conversations').update({ last_message: messageInput.trim(), last_message_at: new Date().toISOString() }).eq('id', activeConvo.id);
    setMessages(prev => [...prev, { ...msg, id: Date.now().toString(), file_url: null, file_name: null, created_at: new Date().toISOString() }]);
    setMessageInput('');
    setSending(false);
  }

  async function sendFile(file: File) {
    if (!user || !activeConvo) return;
    const supabase = createClient();
    const objectName = `messages/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('uploads').upload(objectName, file);
    if (error) { toast.error('Upload failed'); return; }
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${objectName}`;
    await supabase.from('messages').insert({
      conversation_id: activeConvo.id, sender_id: user.id,
      content: file.name, type: file.type.startsWith('image/') ? 'image' : 'file',
      file_url: url, file_name: file.name, reactions: [], read_by: [user.id], sender_name: user.display_name,
    });
    toast.success('File sent!');
    openConversation(activeConvo);
  }

  async function addReaction(messageId: string, emoji: string) {
    if (!user) return;
    const supabase = createClient();
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const reactions = [...msg.reactions];
    const existing = reactions.find(r => r.emoji === emoji);
    if (existing) {
      if (existing.user_ids.includes(user.id)) {
        existing.user_ids = existing.user_ids.filter(id => id !== user.id);
      } else {
        existing.user_ids.push(user.id);
      }
    } else {
      reactions.push({ emoji, user_ids: [user.id] });
    }
    await supabase.from('messages').update({ reactions }).eq('id', messageId);
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    setShowReactions(null);
  }

  async function createGroup() {
    if (!user || !groupName.trim()) return;
    const supabase = createClient();
    const memberNames = groupMembers.split(',').map(n => n.trim()).filter(Boolean);
    await supabase.from('conversations').insert({
      type: 'group', name: groupName.trim(),
      participant_ids: [user.id], participants: [{ id: user.id, display_name: user.display_name, avatar_url: null, online: true }],
      last_message: `Group "${groupName}" created`, last_message_at: new Date().toISOString(), unread_count: 0, typing: [],
    });
    setGroupName(''); setGroupMembers('');
    toast.success('Group created!');
    setTab('messages'); loadConversations();
  }

  function handleTyping() {
    if (!isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  }

  // Active conversation view
  if (activeConvo) {
    const otherParticipant = activeConvo.participants?.find(p => p.id !== user?.id);
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-harbor-800">
          <button onClick={() => setActiveConvo(null)} className="text-gray-400 hover:text-gray-600">←</button>
          <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm relative">
            {(activeConvo.name || otherParticipant?.display_name || '?').charAt(0)}
            {otherParticipant?.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-harbor-950 rounded-full" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{activeConvo.name || otherParticipant?.display_name}</p>
            <p className="text-[10px] text-gray-400">{otherParticipant?.online ? 'Online' : 'Offline'}{activeConvo.type === 'group' ? ` · ${activeConvo.participants?.length || 0} members` : ''}</p>
          </div>
          <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-teal-500 text-lg">📎</button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && sendFile(e.target.files[0])} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[75%] group relative')}>
                  {!isMine && activeConvo.type === 'group' && (
                    <p className="text-[9px] text-gray-400 mb-0.5 ml-1">{msg.sender_name}</p>
                  )}
                  <div className={cn('rounded-2xl px-3 py-2 text-sm', isMine ? 'bg-teal-500 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-harbor-800 text-harbor-800 dark:text-white rounded-bl-sm')}>
                    {msg.type === 'image' && msg.file_url && (
                      <img src={msg.file_url} alt="" className="rounded-xl max-w-full max-h-48 object-cover mb-1" />
                    )}
                    {msg.type === 'file' && msg.file_url && (
                      <a href={msg.file_url} target="_blank" rel="noopener" className="flex items-center gap-2 text-xs underline">📄 {msg.file_name}</a>
                    )}
                    {msg.type === 'text' && <p>{msg.content}</p>}
                  </div>

                  {/* Reactions */}
                  {msg.reactions.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {msg.reactions.filter(r => r.user_ids.length > 0).map(r => (
                        <button key={r.emoji} onClick={() => addReaction(msg.id, r.emoji)} className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-harbor-800 rounded-full hover:scale-110 transition-transform">
                          {r.emoji} {r.user_ids.length > 1 ? r.user_ids.length : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* React button (on hover) */}
                  <button onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)} className="absolute -bottom-2 right-0 opacity-0 group-hover:opacity-100 text-[10px] bg-white dark:bg-harbor-900 border border-gray-200 dark:border-harbor-700 rounded-full px-1.5 py-0.5 shadow-sm transition-opacity">
                    😊+
                  </button>

                  {/* Reaction picker */}
                  {showReactions === msg.id && (
                    <div className="absolute -bottom-8 right-0 flex gap-1 bg-white dark:bg-harbor-900 border border-gray-200 dark:border-harbor-700 rounded-full px-2 py-1 shadow-lg z-10">
                      {QUICK_REACTIONS.map(emoji => (
                        <button key={emoji} onClick={() => addReaction(msg.id, emoji)} className="text-sm hover:scale-125 transition-transform">{emoji}</button>
                      ))}
                    </div>
                  )}

                  {/* Read receipts & time */}
                  <div className={cn('flex items-center gap-1 mt-0.5', isMine ? 'justify-end' : 'justify-start')}>
                    <span className="text-[9px] text-gray-400">{timeAgo(msg.created_at)}</span>
                    {isMine && <span className="text-[9px] text-teal-500">{msg.read_by.length > 1 ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {otherTyping.length > 0 && (
            <div className="flex items-center gap-2 px-2">
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] text-gray-400">typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-harbor-800">
          <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-teal-500">📎</button>
          <input
            value={messageInput}
            onChange={e => { setMessageInput(e.target.value); handleTyping(); }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-harbor-900 rounded-full px-4 py-2 text-sm text-harbor-800 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button onClick={sendMessage} disabled={!messageInput.trim() || sending} className="w-9 h-9 rounded-full bg-teal-500 text-white flex items-center justify-center disabled:opacity-50">
            ↑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Messages</h1>
          <p className="text-xs text-gray-500">{conversations.filter(c => c.unread_count > 0).length} unread</p>
        </div>
        <button onClick={() => setTab('new')} className="btn-teal text-xs">+ New</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['messages', 'groups', 'new'] as ConnectTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t === 'new' ? '+ Create' : t}</button>
        ))}
      </div>

      {/* Conversations List */}
      {(tab === 'messages' || tab === 'groups') && (
        <div className="space-y-1">
          {loading ? [1, 2, 3, 4].map(i => <div key={i} className="card skeleton h-16" />) :
            conversations.filter(c => tab === 'groups' ? c.type === 'group' : c.type === 'direct').length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">✉️</p>
                <p className="text-sm text-gray-500">No {tab === 'groups' ? 'group chats' : 'messages'} yet</p>
              </div>
            ) : conversations.filter(c => tab === 'groups' ? c.type === 'group' : c.type === 'direct').map(convo => {
              const other = convo.participants?.find(p => p.id !== user?.id);
              return (
                <button key={convo.id} onClick={() => openConversation(convo)} className="card w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow py-3">
                  <div className="w-11 h-11 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-sm relative flex-shrink-0">
                    {(convo.name || other?.display_name || '?').charAt(0)}
                    {other?.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-harbor-950 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{convo.name || other?.display_name}</p>
                      {convo.last_message_at && <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(convo.last_message_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">{convo.typing?.length ? 'typing...' : convo.last_message || 'No messages yet'}</p>
                      {convo.unread_count > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] flex items-center justify-center font-bold">{convo.unread_count}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          }
        </div>
      )}

      {/* Create Group */}
      {tab === 'new' && user && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Create Group Chat</h3>
          <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="input-field" />
          <input value={groupMembers} onChange={e => setGroupMembers(e.target.value)} placeholder="Add members (comma separated names)" className="input-field" />
          <button onClick={createGroup} disabled={!groupName.trim()} className="btn-teal w-full disabled:opacity-50">Create Group</button>
        </div>
      )}
    </div>
  );
}
