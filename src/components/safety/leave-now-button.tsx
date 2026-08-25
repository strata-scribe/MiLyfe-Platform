'use client';

import { useState } from 'react';

interface SafetyContact {
  id: string;
  contact_name: string;
  contact_user_id: string | null;
  notify_on_leave_now: boolean;
}

interface LeaveNowButtonProps {
  contacts: SafetyContact[];
  onActivated: () => void;
}

export function LeaveNowButton({ contacts, onActivated }: LeaveNowButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [activating, setActivating] = useState(false);

  const contactsToNotify = contacts.filter((c) => c.notify_on_leave_now);

  async function handleActivate() {
    setActivating(true);
    try {
      const res = await fetch('/api/safety/leave-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notify_contacts: contactsToNotify.map((c) => c.contact_user_id).filter(Boolean),
        }),
      });
      if (res.ok) {
        onActivated();
      }
    } finally {
      setActivating(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="rounded-lg border-2 border-red-500 bg-red-50 p-6">
        <p className="text-lg font-bold text-red-800">Activate Leave-Now?</p>
        <p className="mt-1 text-sm text-red-700">This will immediately:</p>
        <ul className="mt-2 space-y-1 text-sm text-red-700">
          <li>• Freeze your jars (abuser loses access)</li>
          <li>• Hide your location from everyone except keepers</li>
          <li>• Remove all paired devices</li>
          {contactsToNotify.length > 0 && (
            <li>• Notify: {contactsToNotify.map((c) => c.contact_name).join(', ')}</li>
          )}
        </ul>
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleActivate}
            disabled={activating}
            className="rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {activating ? 'Activating...' : 'Yes, activate now'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-md border px-4 py-3 text-sm text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center transition-colors hover:border-red-400 hover:bg-red-100"
    >
      <span className="text-3xl">🛡️</span>
      <p className="mt-2 text-lg font-bold text-red-800">Leave-Now</p>
      <p className="text-sm text-red-600">
        One tap: freeze jars, hide location, remove devices, get help
      </p>
    </button>
  );
}
