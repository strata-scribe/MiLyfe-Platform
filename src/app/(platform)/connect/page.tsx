'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type ConnectTab = 'messages' | 'groups' | 'neighbors';

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  last_message?: string;
  last_time?: string;
  unread: boolean;
  other_name?: string;
  other_avatar?: string;
}

interface NearbyUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  neighborhood: string | null;
}

export default function ConnectPage() {
  const [activeTab, setActiveTab] = useState<ConnectTab>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [neighbors, setNeighbors] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [creating, setCreating] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      // Get user's conversation memberships
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);

      if (!memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }

      const convIds = memberships.map((m) => m.conversation_id);

      // Get conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .in('id', convIds);

      // Get latest message per conversation
      const convList: Conversation[] = [];

      for (const conv of convs ?? []) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // For direct chats, get the other person's name
        let otherName = conv.name ?? 'Chat';
        if (conv.type === 'direct') {
          const { data: otherMember } = await supabase
            .from('conversation_members')
            .select('user_id, profiles!conversation_members_user_id_fkey(display_name)')
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id)
            .maybeSingle();

          if (otherMember?.profiles) {
            otherName = (otherMember.profiles as any).display_name;
          }
        }

        const membership = memberships.find((m) => m.conversation_id === conv.id);
        const unread = lastMsg?.created_at && membership?.last_read_at
          ? new Date(lastMsg.created_at) > new Date(membership.last_read_at)
          : !!lastMsg && !membership?.last_read_at;

        convList.push({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          last_message: lastMsg?.content ?? '',
          last_time: lastMsg?.created_at ? getRelativeTime(lastMsg.created_at) : '',
          unread,
          other_name: otherName,
        });
      }

      setConversations(convList);
      setLoading(false);
    };

    loadConversations();
  }, [user, supabase]);

  // Load neighbors
  useEffect(() => {
    if (!user || activeTab !== 'neighbors') return;

    const loadNeighbors = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, neighborhood')
        .neq('id', user.id)
        .limit(20);

      if (data) setNeighbors(data);
    };

    loadNeighbors();
  }, [user, activeTab, supabase]);

  // Start new conversation
  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    setCreating(true);

    // Create conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ type: 'direct' })
      .select()
      .single();

    if (convError || !conv) {
      setCreating(false);
      return;
    }

    // Add both members
    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUserId },
    ]);

    setCreating(false);
    router.push(`/connect/chat?id=${conv.id}`);
  };

  // Start chat by looking up user email
  const handleNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatEmail.trim() || !user) return;

    const { data: otherUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', newChatEmail.trim())
      .maybeSingle();

    if (!otherUser) {
      alert('User not found. They need a MiLyfe account first.');
      return;
    }

    await startConversation(otherUser.id);
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiConnect</h1>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="btn-teal text-sm !py-2 !px-4"
        >
          + New
        </button>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <form onSubmit={handleNewChat} className="card space-y-3">
          <h3 className="text-sm font-medium text-harbor-800 dark:text-white">Start a conversation</h3>
          <input
            type="email"
            value={newChatEmail}
            onChange={(e) => setNewChatEmail(e.target.value)}
            className="input-field"
            placeholder="Enter their email address"
            required
          />
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn-teal flex-1 text-sm !py-2">
              {creating ? 'Starting...' : 'Start Chat'}
            </button>
            <button type="button" onClick={() => setShowNewChat(false)} className="btn-primary flex-1 text-sm !py-2">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1" role="tablist">
        {(['messages', 'groups', 'neighbors'] as ConnectTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium capitalize transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'messages' && (
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card flex gap-3">
                  <div className="skeleton w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-24" />
                    <div className="skeleton h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">💬</p>
              <p className="text-gray-500 dark:text-gray-400">No conversations yet.</p>
              <p className="text-sm text-gray-400 mt-1">Start one by clicking &quot;+ New&quot; above or wave at a neighbor.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/connect/chat?id=${conv.id}`)}
                className="card w-full flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-lg">
                  {conv.type === 'group' ? '👥' : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      'text-sm truncate',
                      conv.unread ? 'font-bold text-harbor-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                    )}>
                      {conv.other_name}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{conv.last_time}</span>
                  </div>
                  <p className={cn(
                    'text-xs truncate mt-0.5',
                    conv.unread ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'
                  )}>
                    {conv.last_message || 'No messages yet'}
                  </p>
                </div>
                {conv.unread && (
                  <div className="w-2.5 h-2.5 bg-teal-500 rounded-full flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-3">
          {conversations.filter((c) => c.type === 'group').length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">👥</p>
              <p className="text-gray-500">No groups yet.</p>
              <p className="text-sm text-gray-400 mt-1">Group messaging coming soon.</p>
            </div>
          ) : (
            conversations
              .filter((c) => c.type === 'group')
              .map((group) => (
                <button
                  key={group.id}
                  onClick={() => router.push(`/connect/chat?id=${group.id}`)}
                  className="card w-full flex items-center gap-3 text-left"
                >
                  <span className="text-2xl">👥</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{group.name ?? 'Group'}</h3>
                    <p className="text-xs text-gray-500">{group.last_message || 'No messages'}</p>
                  </div>
                </button>
              ))
          )}
        </div>
      )}

      {activeTab === 'neighbors' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Community members on MiLyfe.</p>
          {neighbors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No neighbors found yet.</p>
            </div>
          ) : (
            neighbors.map((neighbor) => (
              <div key={neighbor.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-lg">
                  👤
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-harbor-800 dark:text-white">{neighbor.display_name}</h3>
                  <p className="text-xs text-gray-500">{neighbor.neighborhood ?? 'Community member'}</p>
                </div>
                <button
                  onClick={() => startConversation(neighbor.id)}
                  disabled={creating}
                  className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  Wave
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
