'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Issue {
  id: string; reporter_id: string; title: string; description: string;
  category: string; status: string; location_lat: number | null;
  location_lng: number | null; address: string | null; image_url: string | null;
  upvotes: number; created_at: string; updated_at: string;
  profiles?: { display_name: string };
}

interface StatusEvent { id: string; old_status: string | null; new_status: string; note: string | null; created_at: string; changed_by: string | null; }
interface Comment { id: string; user_id: string; content: string; created_at: string; profiles?: { display_name: string }; }

const statusConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  open: { color: 'text-yellow-700', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '📋', label: 'Open' },
  in_progress: { color: 'text-blue-700', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: '🔧', label: 'In Progress' },
  resolved: { color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30', icon: '✅', label: 'Resolved' },
};

const categoryIcons: Record<string, string> = { infrastructure: '🔧', safety: '⚠️', environment: '🌱', community: '🤝', transit: '🚌' };

export default function IssueDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [timeline, setTimeline] = useState<StatusEvent[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      // Fetch issue
      const { data } = await supabase
        .from('city_issues')
        .select('*, profiles!city_issues_reporter_id_fkey(display_name)')
        .eq('id', id)
        .single();

      if (!data) { setLoading(false); return; }
      setIssue(data);
      setUpvoteCount(data.upvotes);

      // Check if user upvoted
      if (user) {
        const { data: uv } = await supabase.from('issue_upvotes').select('issue_id').eq('issue_id', id).eq('user_id', user.id).maybeSingle();
        setUpvoted(!!uv);
      }

      // Fetch status timeline
      const { data: history } = await supabase
        .from('issue_status_history')
        .select('*')
        .eq('issue_id', id)
        .order('created_at', { ascending: true });
      if (history) setTimeline(history);

      // Fetch comments
      const { data: cmts } = await supabase
        .from('issue_comments')
        .select('*, profiles!issue_comments_user_id_fkey(display_name)')
        .eq('issue_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (cmts) setComments(cmts);

      setLoading(false);
    };
    load();
  }, [id, user, supabase]);

  const handleUpvote = async () => {
    if (!user || !issue) return;
    if (upvoted) {
      await supabase.from('issue_upvotes').delete().eq('issue_id', issue.id).eq('user_id', user.id);
      setUpvoted(false);
      setUpvoteCount(c => c - 1);
      await supabase.from('city_issues').update({ upvotes: upvoteCount - 1 }).eq('id', issue.id);
    } else {
      await supabase.from('issue_upvotes').insert({ issue_id: issue.id, user_id: user.id });
      setUpvoted(true);
      setUpvoteCount(c => c + 1);
      await supabase.from('city_issues').update({ upvotes: upvoteCount + 1 }).eq('id', issue.id);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !issue || !newComment.trim()) return;
    setPosting(true);
    const { data } = await supabase
      .from('issue_comments')
      .insert({ issue_id: issue.id, user_id: user.id, content: newComment.trim() })
      .select('*, profiles!issue_comments_user_id_fkey(display_name)')
      .single();
    if (data) setComments(prev => [data, ...prev]);
    setNewComment('');
    setPosting(false);
  };

  const getRelativeTime = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };

  if (loading) return <div className="space-y-4 animate-slide-up"><div className="skeleton h-48 rounded-xl" /><div className="skeleton h-6 w-48" /><div className="skeleton h-32 rounded-xl" /></div>;
  if (!issue) return <div className="text-center py-16"><p className="text-4xl mb-2">🏛️</p><p className="text-gray-500">Issue not found.</p><button onClick={() => router.push('/city')} className="btn-teal mt-4 text-sm">Back to MiCity</button></div>;

  const status = statusConfig[issue.status] || statusConfig.open;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Back */}
      <button onClick={() => router.push('/city')} className="text-teal-500 text-sm">← MiCity</button>

      {/* Photo */}
      {issue.image_url && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-harbor-700">
          <img src={issue.image_url} alt={issue.title} className="w-full h-48 md:h-64 object-cover" />
        </div>
      )}

      {/* Title + Status */}
      <div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{categoryIcons[issue.category] || '📋'}</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-harbor-800 dark:text-white">{issue.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', status.bg, status.color)}>
                {status.icon} {status.label}
              </span>
              <span className="text-xs text-gray-400 capitalize">{issue.category}</span>
              <span className="text-xs text-gray-400">{getRelativeTime(issue.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reporter + Location */}
      <div className="card space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-xs font-bold">
            {(issue.profiles as any)?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Reported by {(issue.profiles as any)?.display_name}</p>
            <p className="text-xs text-gray-500">{new Date(issue.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>
        {issue.address && <p className="text-xs text-gray-500 flex items-center gap-1">📍 {issue.address}</p>}
        {issue.description && <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line mt-2">{issue.description}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button onClick={handleUpvote} className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all', upvoted ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 border border-teal-300 dark:border-teal-700' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300 border border-transparent')}>
          {upvoted ? '▲' : '△'} {upvoteCount} Upvote{upvoteCount !== 1 ? 's' : ''}
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300">
          🔗 Share
        </button>
      </div>

      {/* Status Timeline */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-500 mb-4">Status Timeline</h2>
        <div className="relative pl-6 space-y-4">
          {/* Initial submission */}
          <div className="relative">
            <div className="absolute left-[-22px] top-1 w-3.5 h-3.5 rounded-full bg-teal-500 border-2 border-white dark:border-harbor-900 z-10" />
            <div className="absolute left-[-16px] top-5 bottom-0 w-0.5 bg-gray-200 dark:bg-harbor-700" />
            <p className="text-sm font-medium text-harbor-800 dark:text-white">Submitted</p>
            <p className="text-xs text-gray-500">{new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
          </div>

          {/* Timeline events */}
          {timeline.map((event, i) => (
            <div key={event.id} className="relative">
              <div className={cn('absolute left-[-22px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-harbor-900 z-10', event.new_status === 'resolved' ? 'bg-green-500' : event.new_status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500')} />
              {i < timeline.length - 1 && <div className="absolute left-[-16px] top-5 bottom-0 w-0.5 bg-gray-200 dark:bg-harbor-700" />}
              <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">
                {event.new_status === 'in_progress' ? 'Assigned & In Progress' : event.new_status === 'resolved' ? 'Resolved' : event.new_status}
              </p>
              {event.note && <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{event.note}</p>}
              <p className="text-xs text-gray-400">{new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
            </div>
          ))}

          {/* Current status (if no history beyond submission) */}
          {timeline.length === 0 && issue.status !== 'open' && (
            <div className="relative">
              <div className={cn('absolute left-[-22px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-harbor-900 z-10', issue.status === 'resolved' ? 'bg-green-500' : 'bg-blue-500')} />
              <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{issue.status.replace('_', ' ')}</p>
              <p className="text-xs text-gray-400">{getRelativeTime(issue.updated_at)}</p>
            </div>
          )}

          {/* Pending indicator */}
          {issue.status !== 'resolved' && (
            <div className="relative">
              <div className="absolute left-[-22px] top-1 w-3.5 h-3.5 rounded-full bg-gray-300 dark:bg-harbor-600 border-2 border-white dark:border-harbor-900 z-10 animate-pulse" />
              <p className="text-sm text-gray-400 italic">
                {issue.status === 'open' ? 'Awaiting acknowledgement...' : 'Awaiting resolution...'}
              </p>
              <p className="text-xs text-gray-400">Auto-escalates after 30 days if unresolved.</p>
            </div>
          )}
        </div>
      </div>

      {/* Map Preview (if coordinates) */}
      {issue.location_lat && issue.location_lng && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Location</h2>
          <a
            href={`https://maps.google.com/?q=${issue.location_lat},${issue.location_lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden border border-gray-200 dark:border-harbor-700"
          >
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${issue.location_lat},${issue.location_lng}&zoom=15&size=400x200&markers=${issue.location_lat},${issue.location_lng}&key=placeholder`}
              alt="Location map"
              className="w-full h-32 object-cover bg-harbor-100 dark:bg-harbor-800"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="p-2 bg-gray-50 dark:bg-harbor-800 text-xs text-teal-500 text-center">
              📍 Open in Google Maps →
            </div>
          </a>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-gray-500">{comments.length} Comment{comments.length !== 1 ? 's' : ''}</h2>

        <form onSubmit={handleComment} className="flex gap-2">
          <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} className="input-field !py-2.5 text-sm flex-1" placeholder="Add a comment or update..." maxLength={500} />
          <button type="submit" disabled={posting || !newComment.trim()} className="btn-teal text-sm !py-2.5 !px-4 disabled:opacity-50">
            {posting ? '...' : 'Post'}
          </button>
        </form>

        {comments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No comments yet. Be the first to discuss this issue.</p>
        ) : comments.map(c => (
          <div key={c.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {(c.profiles as any)?.display_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-harbor-800 dark:text-white">{(c.profiles as any)?.display_name}</span>
                <span className="text-[10px] text-gray-400">{getRelativeTime(c.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
