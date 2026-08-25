'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeaveNowButton } from '@/components/safety/leave-now-button';
import { WalkHomeTimer } from '@/components/safety/walk-home-timer';
import { SafetyContacts } from '@/components/safety/safety-contacts';
import { WitnessMode } from '@/components/safety/witness-mode';

interface SafetyContact {
  id: string;
  contact_name: string;
  contact_phone: string | null;
  contact_user_id: string | null;
  relationship: string;
  notify_on_leave_now: boolean;
  notify_on_timer_expire: boolean;
}

interface SafetyAction {
  id: string;
  type: string;
  status: string;
  freeze_jars: boolean;
  hide_location: boolean;
  created_at: string;
}

interface WalkTimer {
  id: string;
  status: string;
  destination: string | null;
  expected_arrival: string;
  escalation_level: number;
  last_checkin_at: string;
}

interface SafetyViewProps {
  userId: string;
  contacts: SafetyContact[];
  activeActions: SafetyAction[];
  activeTimer: WalkTimer | null;
}

export function SafetyView({ userId, contacts, activeActions, activeTimer }: SafetyViewProps) {
  const router = useRouter();
  const hasActiveLeaveNow = activeActions.some((a) => a.type === 'leave_now');

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Safety</h1>
        <p className="text-muted-foreground">
          Your safety tools. Always one tap away. Never buried.
        </p>
      </div>

      {/* Active alert banner */}
      {hasActiveLeaveNow && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-bold text-red-800">Leave-Now is active</p>
              <p className="text-sm text-red-700">
                Jars frozen. Location hidden. Devices removed.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/safety/deactivate', { method: 'POST' });
              router.refresh();
            }}
            className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Deactivate (I'm safe now)
          </button>
        </div>
      )}

      {/* Leave-Now button (always visible, always accessible) */}
      {!hasActiveLeaveNow && (
        <LeaveNowButton contacts={contacts} onActivated={() => router.refresh()} />
      )}

      {/* Walk-Home Timer */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span>🚶</span> Walk-Home Timer
        </h2>
        <WalkHomeTimer
          activeTimer={activeTimer}
          contacts={contacts}
          onUpdate={() => router.refresh()}
        />
      </div>

      {/* Safety Contacts */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span>👥</span> Safety Contacts
        </h2>
        <SafetyContacts contacts={contacts} onUpdate={() => router.refresh()} />
      </div>

      {/* Resources */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <span>📞</span> Crisis Resources
        </h2>
        <div className="space-y-2 text-sm">
          <ResourceLink label="National DV Hotline" phone="1-800-799-7233" />
          <ResourceLink label="Crisis Text Line" phone="Text HOME to 741741" />
          <ResourceLink label="988 Suicide & Crisis Lifeline" phone="988" />
          <ResourceLink label="Victim Connect" phone="1-855-484-2846" />
        </div>
      </div>

      {/* Hidden Journal link */}
      <div className="rounded-lg border border-dashed p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Need a private space to document?{' '}
          <a href="/safety/journal" className="font-medium text-primary hover:underline">
            Open encrypted journal
          </a>
          {' '}— only you can read it.
        </p>
      </div>

      {/* Witness Mode */}
      <WitnessMode />
    </div>
  );
}

function ResourceLink({ label, phone }: { label: string; phone: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <span className="font-medium">{label}</span>
      <a href={`tel:${phone.replace(/\D/g, '')}`} className="text-primary hover:underline">
        {phone}
      </a>
    </div>
  );
}
