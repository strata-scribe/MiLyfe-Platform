'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Plus, ArrowUp, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  userId: string;
  spaces: any[];
  recentPosts: any[];
}

export function ForumView({ userId, spaces, recentPosts }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterSpace, setFilterSpace] = useState<string | null>(null);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!postTitle.trim() || !postBody.trim() || !selectedSpace) return;
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from('forum_posts').insert({
      space_id: selectedSpace,
      author_id: userId,
      title: postTitle.trim(),
      body: postBody.trim(),
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Post created!');
      setPostTitle('');
      setPostBody('');
      setShowCreate(false);
    }
    setSubmitting(false);
  }

  const filteredPosts = filterSpace
    ? recentPosts.filter(p => p.space_id === filterSpace)
    : recentPosts;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">Forum</h1>
          <p className="page-subtitle">Community discussions</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
          New Post
        </Button>
      </div>

      {/* Spaces grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="list" aria-label="Forum spaces">
        {spaces.map((space) => (
          <button
            key={space.id}
            onClick={() => setFilterSpace(filterSpace === space.id ? null : space.id)}
            className={`card text-center py-3 cursor-pointer transition-all ${
              filterSpace === space.id ? 'ring-2 ring-teal-500 bg-teal-50 dark:bg-teal-900/20' : ''
            }`}
            aria-pressed={filterSpace === space.id}
          >
            <span className="text-xl mb-1 block" role="img" aria-label={space.name}>{space.icon}</span>
            <p className="text-xs font-medium text-harbor-800 dark:text-white">{space.name}</p>
            <p className="text-[10px] text-gray-500">{space.post_count} posts</p>
          </button>
        ))}
      </div>

      {/* Create post */}
      {showCreate && (
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader>
            <CardTitle>New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createPost} className="space-y-3">
              <select
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}
                className="w-full h-10 rounded-xl border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-950 px-3 text-sm"
                required
                aria-label="Select space"
              >
                <option value="">Select a space...</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                ))}
              </select>
              <Input
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Post title"
                required
                maxLength={120}
                aria-label="Post title"
              />
              <Textarea
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                placeholder="What's on your mind?"
                required
                className="min-h-[100px]"
                aria-label="Post content"
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Posting...' : 'Post'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      <section aria-labelledby="posts-heading">
        <h2 id="posts-heading" className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
          {filterSpace ? `Posts in ${spaces.find(s => s.id === filterSpace)?.name || 'space'}` : 'Recent Posts'}
        </h2>

        {filteredPosts.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No posts yet"
            description="Start the conversation — create the first post."
          />
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <Link href={`/forum/${post.id}`} key={post.id} className="block"><Card>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={post.author?.display_name || 'U'} src={post.author?.avatar_url} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">@{post.author?.username}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                        {post.space && (
                          <Badge variant="secondary" className="text-[10px]">
                            {post.space.icon} {post.space.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-harbor-800 dark:text-white mb-1">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {post.body}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                          {post.upvotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                          {post.reply_count} replies
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card></Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
