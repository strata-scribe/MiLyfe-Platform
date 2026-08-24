'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, MapPin, Calendar, Edit, LogOut, Save, Star, Shield,
  MessageCircle, Users, Coins, Award, Clock, ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/types/database';

interface Props {
  profile: Tables<'profiles'> | null;
  standing: Tables<'standing'> | null;
  badges: any[];
  wallet: Tables<'wallets'> | null;
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
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        neighborhood: neighborhood.trim() || null,
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Profile updated!');
      setUser(data as Tables<'profiles'>);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  if (!profile) return null;

  const totalBalance = wallet
    ? wallet.spending_balance + wallet.savings_balance + wallet.community_balance
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <h1 className="page-title">Profile</h1>
        <Button
          size="sm"
          variant={editing ? 'default' : 'outline'}
          onClick={() => editing ? handleSave() : setEditing(true)}
          disabled={saving}
        >
          {editing ? (
            <><Save className="h-4 w-4 mr-1" aria-hidden="true" />{saving ? 'Saving...' : 'Save'}</>
          ) : (
            <><Edit className="h-4 w-4 mr-1" aria-hidden="true" />Edit</>
          )}
        </Button>
      </div>

      {/* ═══ CITIZEN CARD ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-harbor-800 via-harbor-900 to-harbor-950 p-5 text-white shadow-xl">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-teal-500/10 blur-2xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-mly-500/10 blur-2xl" aria-hidden="true" />

        {/* Card header */}
        <div className="flex items-center justify-between mb-4 relative">
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-harbor-200">Mi</span>
            <span className="text-sm font-bold text-teal-400">Lyfe</span>
            <span className="text-[10px] text-harbor-300 ml-2">CITIZEN CARD</span>
          </div>
          <Badge className="bg-white/10 text-white border-white/20 capitalize text-[10px]">
            {profile.role}
          </Badge>
        </div>

        {/* Identity */}
        <div className="flex items-center gap-4 mb-4 relative">
          <div className="relative">
            <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" className="ring-2 ring-teal-400/50" />
            {standing && standing.overall > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-teal-500 rounded-full h-6 w-6 flex items-center justify-center text-[9px] font-bold ring-2 ring-harbor-900">
                {standing.overall.toFixed(0)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold">{profile.display_name}</h2>
            <p className="text-sm text-harbor-200">@{profile.username}</p>
            {profile.neighborhood && (
              <p className="text-xs text-harbor-300 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" aria-hidden="true" />{profile.neighborhood}
              </p>
            )}
          </div>
        </div>

        {/* Standing facets bar */}
        {standing && (
          <div className="flex gap-1 mb-4 relative">
            {FACETS.map(({ key, color }) => {
              const val = (standing as any)[key] || 0;
              return (
                <div key={key} className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                    style={{ width: `${val}%` }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Card stats */}
        <div className="grid grid-cols-4 gap-2 relative">
          <div className="text-center">
            <p className="text-base font-bold">{totalBalance.toFixed(0)}</p>
            <p className="text-[9px] text-harbor-300">$MLY</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold">{connectionCount}</p>
            <p className="text-[9px] text-harbor-300">Connections</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold">{attestationsGivenCount}</p>
            <p className="text-[9px] text-harbor-300">Attested</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold">{badges.length}</p>
            <p className="text-[9px] text-harbor-300">Badges</p>
          </div>
        </div>

        {/* Member since */}
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between relative">
          <p className="text-[10px] text-harbor-300 flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Member since {format(new Date(profile.created_at), 'MMMM yyyy')}
          </p>
          <p className="text-[10px] text-harbor-400 font-mono">
            #{profile.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Edit form (inline) */}
      {editing && (
        <Card className="border-teal-200 dark:border-teal-800">
          <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label htmlFor="display-name" className="text-xs font-medium block mb-1">Display Name</label>
              <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="bio" className="text-xs font-medium block mb-1">Bio</label>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="About you..." />
              <p className="text-xs text-gray-400 mt-1">{bio.length}/200</p>
            </div>
            <div>
              <label htmlFor="neighborhood" className="text-xs font-medium block mb-1">Neighborhood</label>
              <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Your neighborhood" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bio (non-editing) */}
      {!editing && profile.bio && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">{profile.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Activity / Standing / Badges */}
      <Tabs defaultValue="activity">
        <TabsList className="w-full">
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          <TabsTrigger value="standing" className="flex-1">Standing</TabsTrigger>
          <TabsTrigger value="badges" className="flex-1">Badges</TabsTrigger>
        </TabsList>

        {/* Activity tab */}
        <TabsContent value="activity">
          <div className="space-y-4">
            {/* Recent posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4 text-teal-500" aria-hidden="true" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPosts.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No posts yet</p>
                ) : (
                  <ul className="space-y-2">
                    {recentPosts.map((post) => (
                      <li key={post.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{post.title}</p>
                          <p className="text-xs text-gray-500">
                            {post.space?.icon} {post.space?.name} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Attestations received */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-purple-500" aria-hidden="true" />
                  Attestations Received
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attestationsReceived.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No attestations yet — contribute to earn recognition</p>
                ) : (
                  <ul className="space-y-3">
                    {attestationsReceived.map((att) => (
                      <li key={att.id} className="flex items-start gap-3">
                        <Avatar name={att.from_user?.display_name || 'U'} src={att.from_user?.avatar_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">@{att.from_user?.username}</span>
                            <Badge variant="default" className="capitalize text-[10px]">{att.facet}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{att.reason}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Contribution stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Coins className="h-4 w-4 text-mly-500" aria-hidden="true" />
                  Economy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-lg font-bold text-mly-600">{wallet?.total_earned.toFixed(0) || 0}</p>
                    <p className="text-xs text-gray-500">$MLY Earned (lifetime)</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-harbor-800 dark:text-white">{wallet?.total_spent.toFixed(0) || 0}</p>
                    <p className="text-xs text-gray-500">$MLY Spent (lifetime)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Standing tab */}
        <TabsContent value="standing">
          <Card>
            <CardContent className="pt-4 space-y-4">
              {FACETS.map(({ key, label, color }) => {
                const val = standing ? (standing as any)[key] : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-harbor-800 dark:text-white">{label}</span>
                      <span className="text-sm font-bold">{val.toFixed(1)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 dark:bg-harbor-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-gray-100 dark:border-harbor-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-harbor-800 dark:text-white">Overall</span>
                  <span className="text-lg font-bold text-teal-600">{standing?.overall.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges tab */}
        <TabsContent value="badges">
          <Card>
            <CardContent className="pt-4">
              {badges.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-gray-500">No badges yet</p>
                  <p className="text-xs text-gray-400">Keep contributing to unlock achievements</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {badges.map((ub) => (
                    <div key={ub.id} className="flex flex-col items-center text-center p-3 rounded-xl bg-gray-50 dark:bg-harbor-900 hover:scale-105 transition-transform">
                      <span className="text-3xl mb-1.5" role="img" aria-label={ub.badge?.name}>{ub.badge?.icon}</span>
                      <p className="text-xs font-bold text-harbor-800 dark:text-white">{ub.badge?.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{ub.badge?.description}</p>
                      <p className="text-[9px] text-gray-400 mt-1">
                        {format(new Date(ub.earned_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sign out */}
      <Button
        variant="ghost"
        className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  );
}
