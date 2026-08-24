'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, Calendar, Edit, LogOut, Save, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Tables } from '@/types/database';

interface Props {
  profile: Tables<'profiles'> | null;
  standing: Tables<'standing'> | null;
  badges: any[];
  walletStats: { total_earned: number; total_spent: number } | null;
}

export function ProfileView({ profile, standing, badges, walletStats }: Props) {
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

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" />
            {editing ? (
              <div className="mt-4 w-full max-w-xs space-y-3">
                <div>
                  <label htmlFor="display-name" className="text-xs font-medium block mb-1 text-left">Display Name</label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>
                <div>
                  <label htmlFor="bio" className="text-xs font-medium block mb-1 text-left">Bio</label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="About you..."
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="neighborhood" className="text-xs font-medium block mb-1 text-left">Neighborhood</label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Your neighborhood"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-harbor-800 dark:text-white mt-3">
                  {profile.display_name}
                </h2>
                <p className="text-sm text-gray-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 max-w-sm">{profile.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  {profile.neighborhood && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" aria-hidden="true" />{profile.neighborhood}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" aria-hidden="true" />
                    Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Role badge */}
          <div className="flex justify-center">
            <Badge variant="harbor" className="capitalize">{profile.role}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-4">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">
            {standing?.overall?.toFixed(0) || 0}
          </p>
          <p className="text-xs text-gray-500">Standing</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-lg font-bold text-mly-600">
            {walletStats?.total_earned?.toFixed(0) || 0}
          </p>
          <p className="text-xs text-gray-500">$MLY Earned</p>
        </Card>
        <Card className="text-center py-4">
          <p className="text-lg font-bold text-harbor-800 dark:text-white">
            {badges.length}
          </p>
          <p className="text-xs text-gray-500">Badges</p>
        </Card>
      </div>

      {/* Standing preview */}
      {standing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-teal-500" aria-hidden="true" />
              Standing Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['neighbor', 'carer', 'maker', 'teacher', 'keeper', 'voice', 'shop', 'helper'].map((facet) => (
              <div key={facet} className="flex items-center gap-3">
                <span className="text-xs capitalize w-16 text-gray-600 dark:text-gray-400">{facet}</span>
                <Progress value={(standing as any)[facet]} className="flex-1 h-1.5" />
                <span className="text-xs font-medium w-8 text-right">{(standing as any)[facet].toFixed(0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map((ub) => (
                <div key={ub.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-harbor-900">
                  <span role="img" aria-label={ub.badge?.name}>{ub.badge?.icon}</span>
                  <span className="text-xs font-medium">{ub.badge?.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign out */}
      <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
        Sign out
      </Button>
    </div>
  );
}
