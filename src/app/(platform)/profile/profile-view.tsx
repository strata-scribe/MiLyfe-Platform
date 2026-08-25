'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Edit, LogOut, Save, MessageCircle, Coins, Award } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { updateProfile } from '@/lib/actions/profile';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { StandingRadar } from '@/components/profile/standing-radar';
import { PrivacyDashboard } from '@/components/profile/privacy-dashboard';
import { FormField, inputStyles, textareaStyles } from '@/components/ui/form-field';

interface Props {
  profile: any;
  standing: any;
  badges: any[];
  wallet: any;
  attestationsGivenCount: number;
  attestationsReceived: any[];
  recentPosts: any[];
  connectionCount: number;
}

const FACETS = [
  { key: 'neighbor', label: 'Neighbor', color: 'from-blue-400 to-blue-600' },
  { key: 'carer', label: 'Carer', color: 'from-pink-400 to-pink-600' },
  { key: 'maker', label: 'Maker', color: 'from-orange-400 to-orange-600' },
  { key: 'teacher', label: 'Teacher', color: 'from-purple-400 to-purple-600' },
  { key: 'keeper', label: 'Keeper', color: 'from-green-400 to-green-600' },
  { key: 'voice', label: 'Voice', color: 'from-teal-400 to-teal-600' },
  { key: 'shop', label: 'Shop', color: 'from-yellow-400 to-yellow-600' },
  { key: 'helper', label: 'Helper', color: 'from-indigo-400 to-indigo-600' },
];

type TabId = 'standing' | 'activity' | 'badges' | 'privacy';

export function ProfileView({
  profile, standing, badges, wallet,
  attestationsGivenCount, attestationsReceived, recentPosts, connectionCount,
}: Props) {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [neighborhood, setNeighborhood] = useState(profile?.neighborhood || '');
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<TabId>('standing');

  if (!profile) return null;

  const totalBalance = wallet
    ? wallet.spending_balance + wallet.savings_balance + wallet.community_balance
    : 0;

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        neighborhood: neighborhood.trim() || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Profile updated!');
        setEditing(false);
        router.refresh();
      }
    });
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">You</h1>
        <button
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={isPending}
          className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {editing ? <><Save className="h-4 w-4" />{isPending ? 'Saving...' : 'Save'}</> : <><Edit className="h-4 w-4" />Edit</>}
        </button>
      </div>

      {/* Citizen Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-5 text-white">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar with upload */}
          <div className="relative">
            {editing ? (
              <AvatarUpload
                currentUrl={profile.avatar_url}
                onUploaded={(url) => { router.refresh(); }}
              />
            ) : (
              <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-700 ring-2 ring-teal-400/50">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xl font-bold text-teal-300">
                    {profile.display_name?.slice(0, 2).toUpperCase() || 'MI'}
                  </div>
                )}
              </div>
            )}
            {standing?.overall > 0 && !editing && (
              <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full h-6 w-6 flex items-center justify-center text-[9px] font-bold ring-2 ring-slate-900">
                {standing.overall.toFixed(0)}
              </div>
            )}
          </div>
          <div>
            {editing ? (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm font-bold"
              />
            ) : (
              <h2 className="text-lg font-bold">{profile.display_name}</h2>
            )}
            <p className="text-sm text-slate-300">@{profile.username}</p>
            {profile.neighborhood && !editing && (
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{profile.neighborhood}
              </p>
            )}
          </div>
        </div>

        {/* Standing facets bar */}
        {standing && (
          <div className="flex gap-1 mb-3">
            {FACETS.map(({ key, color }) => {
              const val = standing[key] || 0;
              return (
                <div key={key} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${val}%` }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div><p className="text-base font-bold">{totalBalance.toFixed(0)}</p><p className="text-[9px] text-slate-400">$MLY</p></div>
          <div><p className="text-base font-bold">{connectionCount}</p><p className="text-[9px] text-slate-400">Connections</p></div>
          <div><p className="text-base font-bold">{attestationsGivenCount}</p><p className="text-[9px] text-slate-400">Attested</p></div>
          <div><p className="text-base font-bold">{badges.length}</p><p className="text-[9px] text-slate-400">Badges</p></div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Calendar className="h-3 w-3" />Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
          </p>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] capitalize">{profile.role}</span>
        </div>
      </div>

      {/* Edit form (expanded) */}
      {editing && (
        <div className="rounded-lg border p-4 space-y-3">
          <FormField label="Bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              placeholder="Tell people about yourself..."
              className={textareaStyles}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
          </FormField>
          <FormField label="Neighborhood">
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Your neighborhood"
              className={inputStyles}
            />
          </FormField>
        </div>
      )}

      {/* Bio (when not editing) */}
      {!editing && profile.bio && (
        <p className="text-sm text-muted-foreground rounded-lg border p-4">{profile.bio}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(['standing', 'activity', 'badges', 'privacy'] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Standing tab — RADAR CHART */}
      {activeTab === 'standing' && standing && (
        <div className="rounded-lg border p-4">
          <StandingRadar facets={{
            neighbor: standing.neighbor || 0,
            carer: standing.carer || 0,
            maker: standing.maker || 0,
            teacher: standing.teacher || 0,
            keeper: standing.keeper || 0,
            voice: standing.voice || 0,
            shop: standing.shop || 0,
            helper: standing.helper || 0,
          }} />
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">Overall Standing</p>
            <p className="text-3xl font-bold text-primary">{standing.overall?.toFixed(1) || '0.0'}</p>
          </div>
        </div>
      )}

      {/* Activity tab */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Attestations received */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-purple-500" /> Recognition Received
            </h3>
            {attestationsReceived.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No attestations yet. Contribute to earn recognition.</p>
            ) : (
              <div className="space-y-2">
                {attestationsReceived.slice(0, 5).map((att) => (
                  <div key={att.id} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">@{att.from_user?.username || 'member'}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{att.facet}</span>
                    <span className="text-muted-foreground truncate flex-1">"{att.reason}"</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Economy */}
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Coins className="h-4 w-4 text-yellow-500" /> Economy
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xl font-bold">{wallet?.total_earned?.toFixed(0) || 0}</p>
                <p className="text-xs text-muted-foreground">$MLY Earned</p>
              </div>
              <div>
                <p className="text-xl font-bold">{wallet?.total_spent?.toFixed(0) || 0}</p>
                <p className="text-xs text-muted-foreground">$MLY Spent</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badges tab */}
      {activeTab === 'badges' && (
        <div className="rounded-lg border p-4">
          {badges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl">🏅</p>
              <p className="mt-2 text-muted-foreground">No badges yet. Keep contributing!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {badges.map((ub) => (
                <div key={ub.id} className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                  <span className="text-3xl">{ub.badge?.icon || '⭐'}</span>
                  <p className="text-xs font-bold mt-1">{ub.badge?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(ub.earned_at), 'MMM d, yyyy')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Privacy tab — PRIVACY DASHBOARD */}
      {activeTab === 'privacy' && <PrivacyDashboard />}

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
