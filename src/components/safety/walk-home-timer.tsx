'use client';

import { useState, useEffect } from 'react';
import { executeWithOfflineFallback } from '@/lib/offline/action-wrapper';

interface WalkTimer {
  id: string;
  status: string;
  destination: string | null;
  expected_arrival: string;
  escalation_level: number;
  last_checkin_at: string;
}

interface SafetyContact {
  id: string;
  contact_name: string;
  notify_on_timer_expire: boolean;
}

interface WalkHomeTimerProps {
  activeTimer: WalkTimer | null;
  contacts: SafetyContact[];
  onUpdate: () => void;
}

export function WalkHomeTimer({ activeTimer, contacts, onUpdate }: WalkHomeTimerProps) {
  const [starting, setStarting] = useState(false);
  const [destination, setDestination] = useState('');
  const [minutes, setMinutes] = useState(15);

  if (activeTimer) {
    return <ActiveTimer timer={activeTimer} onUpdate={onUpdate} />;
  }

  if (starting) {
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Where are you going? (optional)"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-muted-foreground">Expected arrival:</label>
          <select
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          If you don't check in by then, your safety contacts will be notified:
          {' '}{contacts.filter(c => c.notify_on_timer_expire).map(c => c.contact_name).join(', ') || '(none set)'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              const res = await fetch('/api/safety/timer/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ destination, minutes }),
              });
              if (res.ok) onUpdate();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Start Timer
          </button>
          <button
            onClick={() => setStarting(false)}
            className="rounded-md border px-4 py-2 text-sm text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        Walking somewhere? Start a timer. If you don't check in, your contacts get notified.
      </p>
      <button
        onClick={() => setStarting(true)}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Start Walk-Home Timer
      </button>
    </div>
  );
}

function ActiveTimer({ timer, onUpdate }: { timer: WalkTimer; onUpdate: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(timer.expected_arrival).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('OVERDUE');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timer.expected_arrival]);

  const isOverdue = timeLeft === 'OVERDUE';

  return (
    <div className={`rounded-lg p-4 ${isOverdue ? 'bg-red-50 border border-red-300' : 'bg-green-50 border border-green-300'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {isOverdue ? '⚠️ Timer expired — are you OK?' : '🚶 Walking...'}
          </p>
          {timer.destination && (
            <p className="text-xs text-muted-foreground">To: {timer.destination}</p>
          )}
        </div>
        <div className={`text-2xl font-bold tabular-nums ${isOverdue ? 'text-red-600' : 'text-green-700'}`}>
          {timeLeft}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={async () => {
            await executeWithOfflineFallback(
              'safety.timer_arrived',
              {},
              async () => {
                const res = await fetch('/api/safety/timer/arrived', { method: 'POST' });
                return res.ok ? { success: true } : { error: 'Failed' };
              },
            );
            onUpdate();
          }}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white"
        >
          I'm here safely ✓
        </button>
        <button
          onClick={async () => {
            await fetch('/api/safety/timer/extend', { method: 'POST' });
            onUpdate();
          }}
          className="rounded-md border px-4 py-2 text-sm text-muted-foreground"
        >
          +15 min
        </button>
      </div>
    </div>
  );
}
