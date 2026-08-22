'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { FeatureGate } from '@/components/ui/feature-gate';

interface Channel {
  id: string;
  user_id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  banner_url: string | null;
  subscriber_count: number;
  content_count: number;
  created_at: string;
  creator_name: string;
  is_subscribed?: boolean;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAppStore();

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    const supabase = createClient();
    const { data } = await supabase
      .from('media_channels')
      .select('*, profiles!media_channels_user_id_fkey(display_name)')
      .order('subscriber_count', { ascending: false });

    if (data) {
      const mapped: Channel[] = data.map((ch: any) => ({
        id: ch.id,
        user_id: ch.user_id,
        name: ch.name,
        description: ch.description || '',
        avatar_url: ch.avatar_url,
        banner_url: ch.banner_url,
        subscriber_count: ch.subscriber_count || 0,
        content_count: ch.content_count || 0,
        created_at: ch.created_at,
        creator_name: ch.profiles?.display_name || 'Creator',
      }));
      setChannels(mapped);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!name.trim() || !user) return;
    setCreating(true);
    const supabase = createClient();
    const { error } = await supabase.from('media_channels').insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim(),
      subscriber_count: 0,
      content_count: 0,
    });
    if (!error) {
      setName('');
      setDescription('');
      setShowCreate(false);
      loadChannels();
    }
    setCreating(false);
  }

  async function toggleSubscribe(channel: Channel) {
    if (!user) return;
    const supabase = createClient();

    if (channel.is_subscribed) {
      await supabase
        .from('channel_subscriptions')
        .delete()
        .eq('channel_id', channel.id)
        .eq('user_id', user.id);
    } else {
      await supabase.from('channel_subscriptions').insert({
        channel_id: channel.id,
        user_id: user.id,
      });
    }
    loadChannels();
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-harbor-800 rounded w-48" />
        <div className="h-32 bg-gray-200 dark:bg-harbor-800 rounded" />
        <div className="h-32 bg-gray-200 dark:bg-harbor-800 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Channels</h1>
          <p className="text-xs text-gray-500">Creator pages on MiMedia</p>
        </div>
        {user && (
          <FeatureGate featureId="media_channel">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="btn-primary text-xs"
            >
              + Create Channel
            </button>
          </FeatureGate>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">
            Create Your Channel
          </h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name"
            className="input-field"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is your channel about?"
            rows={3}
            className="input-field resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || creating}
              className="btn-primary text-xs"
            >
              {creating ? 'Creating...' : 'Create Channel'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Channel list */}
      {channels.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-2">📺</p>
          <p className="text-sm text-gray-500">No channels yet.</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to create one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((ch) => (
            <div key={ch.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-harbor-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                  {ch.avatar_url ? (
                    <img
                      src={ch.avatar_url}
                      alt={ch.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    ch.name.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/media/channels/${ch.id}`}
                    className="text-sm font-bold text-harbor-800 dark:text-white hover:text-teal-600 transition-colors"
                  >
                    {ch.name}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {ch.description || `by ${ch.creator_name}`}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>👥 {ch.subscriber_count} subscribers</span>
                    <span>🎬 {ch.content_count} uploads</span>
                  </div>
                </div>

                {/* Subscribe button */}
                {user && user.id !== ch.user_id && (
                  <button
                    onClick={() => toggleSubscribe(ch)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      ch.is_subscribed
                        ? 'bg-gray-200 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
                        : 'bg-teal-500 text-white hover:bg-teal-600'
                    }`}
                  >
                    {ch.is_subscribed ? 'Subscribed' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
