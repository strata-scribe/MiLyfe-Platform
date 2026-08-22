'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';

interface ChannelDetail {
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
}

interface ChannelContent {
  id: string;
  title: string;
  type: 'video' | 'music' | 'podcast';
  thumbnail_url: string | null;
  likes: number;
  plays: number;
  created_at: string;
}

export default function ChannelDetailPage() {
  const { id } = useParams();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [content, setContent] = useState<ChannelContent[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAppStore();

  useEffect(() => {
    loadChannel();
  }, [id]);

  async function loadChannel() {
    const supabase = createClient();

    // Fetch channel
    const { data: ch } = await supabase
      .from('media_channels')
      .select('*, profiles!media_channels_user_id_fkey(display_name)')
      .eq('id', id)
      .single();

    if (ch) {
      setChannel({
        id: ch.id,
        user_id: ch.user_id,
        name: ch.name,
        description: ch.description || '',
        avatar_url: ch.avatar_url,
        banner_url: ch.banner_url,
        subscriber_count: ch.subscriber_count || 0,
        content_count: ch.content_count || 0,
        created_at: ch.created_at,
        creator_name: (ch as any).profiles?.display_name || 'Creator',
      });

      // Check subscription status
      if (user) {
        const { data: sub } = await supabase
          .from('channel_subscriptions')
          .select('id')
          .eq('channel_id', ch.id)
          .eq('user_id', user.id)
          .single();
        setIsSubscribed(!!sub);
      }

      // Fetch channel content
      const { data: media } = await supabase
        .from('media_content')
        .select('id, title, type, thumbnail_url, likes, plays, created_at')
        .eq('user_id', ch.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (media) setContent(media as ChannelContent[]);
    }
    setLoading(false);
  }

  async function toggleSubscribe() {
    if (!user || !channel) return;
    const supabase = createClient();

    if (isSubscribed) {
      await supabase
        .from('channel_subscriptions')
        .delete()
        .eq('channel_id', channel.id)
        .eq('user_id', user.id);
      setIsSubscribed(false);
      setChannel((c) => c ? { ...c, subscriber_count: c.subscriber_count - 1 } : c);
    } else {
      await supabase.from('channel_subscriptions').insert({
        channel_id: channel.id,
        user_id: user.id,
      });
      setIsSubscribed(true);
      setChannel((c) => c ? { ...c, subscriber_count: c.subscriber_count + 1 } : c);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-harbor-800 rounded-xl" />
        <div className="h-8 bg-gray-200 dark:bg-harbor-800 rounded w-48" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Channel not found.</p>
        <Link href="/media/channels" className="text-xs text-teal-600 mt-2 inline-block">
          ← Back to Channels
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Banner */}
      <div className="relative h-32 rounded-xl overflow-hidden bg-gradient-to-br from-harbor-700 to-teal-600">
        {channel.banner_url && (
          <img
            src={channel.banner_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Channel header */}
      <div className="flex items-start gap-4 -mt-8 relative z-10 px-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-harbor-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-harbor-900 flex-shrink-0">
          {channel.avatar_url ? (
            <img
              src={channel.avatar_url}
              alt={channel.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            channel.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 pt-8">
          <h1 className="text-lg font-bold text-harbor-800 dark:text-white">
            {channel.name}
          </h1>
          <p className="text-xs text-gray-500">
            by {channel.creator_name} · {channel.subscriber_count} subscribers
          </p>
        </div>
      </div>

      {/* Description + Subscribe */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-300 flex-1">
          {channel.description}
        </p>
        {user && user.id !== channel.user_id && (
          <button
            onClick={toggleSubscribe}
            className={`ml-4 text-sm px-4 py-2 rounded-full font-medium transition-colors ${
              isSubscribed
                ? 'bg-gray-200 dark:bg-harbor-800 text-gray-600 dark:text-gray-300'
                : 'bg-teal-500 text-white hover:bg-teal-600'
            }`}
          >
            {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-xs text-gray-400 py-2 border-y border-gray-100 dark:border-harbor-800">
        <span>🎬 {channel.content_count} uploads</span>
        <span>👥 {channel.subscriber_count} subscribers</span>
        <span>📅 Joined {new Date(channel.created_at).toLocaleDateString()}</span>
      </div>

      {/* Content grid */}
      <div>
        <h2 className="text-sm font-bold text-harbor-800 dark:text-white mb-3">
          Content
        </h2>
        {content.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-sm text-gray-500">No content uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {content.map((item) => (
              <Link
                key={item.id}
                href={`/media/${item.id}`}
                className="group"
              >
                <div className="aspect-video rounded-lg bg-gray-100 dark:bg-harbor-800 overflow-hidden relative">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {item.type === 'video' ? '🎬' : item.type === 'music' ? '🎵' : '🎙️'}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                    {item.type}
                  </div>
                </div>
                <p className="text-xs font-medium text-harbor-800 dark:text-white mt-1.5 line-clamp-2">
                  {item.title}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  ❤️ {item.likes || 0} · ▶️ {item.plays || 0}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Back link */}
      <Link
        href="/media/channels"
        className="inline-block text-xs text-teal-600 hover:underline"
      >
        ← All Channels
      </Link>
    </div>
  );
}
