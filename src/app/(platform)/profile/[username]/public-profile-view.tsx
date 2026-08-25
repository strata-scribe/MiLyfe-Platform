'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { StandingRadar } from '@/components/profile/standing-radar';
import { GiveAttestation } from '@/components/profile/give-attestation';

interface PublicProfileViewProps {
  profile: any;
  standing: any;
  badges: any[];
  attestations: any[];
  isOwnProfile: boolean;
  viewerId: string;
}

export function PublicProfileView({ profile, standing, badges, attestations, isOwnProfile, viewerId }: PublicProfileViewProps) {
  const [showAttestation, setShowAttestation] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {isOwnProfile && (
        <Link href="/profile" className="text-sm text-primary hover:underline">
          ← Go to full profile (edit mode)
        </Link>
      )}

      {/* Profile card */}
      <div className="rounded-xl border p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                {profile.display_name?.slice(0, 2).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            {profile.neighborhood && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{profile.neighborhood}
              </p>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>
        )}

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Member since {format(new Date(profile.created_at), 'MMM yyyy')}
          </span>
          <span className="capitalize">{profile.role}</span>
        </div>

        {/* Action: Recognize */}
        {!isOwnProfile && (
          <button
            onClick={() => setShowAttestation(true)}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            ✨ Recognize This Person
          </button>
        )}
      </div>

      {/* Standing */}
      {standing && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Standing</h2>
          <StandingRadar facets={{
            neighbor: standing.neighbor || 0,
            carer: standing.carer || 0,
            maker: standing.maker || 0,
            teacher: standing.teacher || 0,
            keeper: standing.keeper || 0,
            voice: standing.voice || 0,
            shop: standing.shop || 0,
            helper: standing.helper || 0,
          }} size={240} />
          <p className="text-center mt-2 text-sm text-muted-foreground">
            Overall: <span className="font-bold text-foreground">{standing.overall?.toFixed(1)}</span>
          </p>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Badges ({badges.length})</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <div key={i} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
                <span>{b.badge_icon}</span>
                <span>{b.badge_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent attestations */}
      {attestations.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Recognition Received</h2>
          <div className="space-y-2">
            {attestations.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium">@{(a.profiles as any)?.username || 'member'}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{a.facet}</span>
                <span className="text-muted-foreground truncate flex-1">"{a.reason}"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Give Attestation Modal */}
      <GiveAttestation
        toUserId={profile.id}
        toDisplayName={profile.display_name}
        open={showAttestation}
        onClose={() => setShowAttestation(false)}
      />
    </div>
  );
}
