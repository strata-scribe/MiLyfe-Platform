'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface SecurityDevice {
  id: string;
  home_id: string;
  name: string;
  type: 'camera' | 'lock' | 'sensor' | 'alarm' | 'doorbell';
  location: string;
  status: 'armed' | 'disarmed' | 'triggered' | 'offline';
  battery: number | null;
  last_event: string | null;
}

interface SecurityEvent {
  id: string;
  home_id: string;
  device_id: string;
  type: 'motion' | 'door_open' | 'door_close' | 'alarm' | 'lock' | 'unlock' | 'tamper';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  created_at: string;
  device_name?: string;
}

interface AccessCode {
  id: string;
  home_id: string;
  name: string;
  code_hash: string;
  type: 'permanent' | 'temporary' | 'one_time';
  valid_until: string | null;
  used_count: number;
  active: boolean;
}

type SecurityTab = 'status' | 'events' | 'access' | 'settings';

const DEVICE_ICONS: Record<string, string> = {
  camera: '📹', lock: '🔐', sensor: '📡', alarm: '🚨', doorbell: '🔔',
};

const STATUS_COLORS: Record<string, string> = {
  armed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  disarmed: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  triggered: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  offline: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const SEVERITY_COLORS: Record<string, string> = {
  info: 'text-blue-600', warning: 'text-orange-600', critical: 'text-red-600',
};

export default function SecurityPage() {
  const [tab, setTab] = useState<SecurityTab>('status');
  const [devices, setDevices] = useState<SecurityDevice[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemArmed, setSystemArmed] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: d } = await supabase.from('mihome_security_devices').select('*');
    if (d) {
      setDevices(d);
      setSystemArmed(d.some(dev => dev.status === 'armed'));
    }
    const { data: e } = await supabase.from('mihome_security_events').select('*').order('created_at', { ascending: false }).limit(30);
    if (e) setEvents(e);
    const { data: a } = await supabase.from('mihome_access_codes').select('*').order('created_at', { ascending: false });
    if (a) setAccessCodes(a);
    setLoading(false);
  }

  async function toggleSystem() {
    const supabase = createClient();
    const newStatus = systemArmed ? 'disarmed' : 'armed';
    await supabase.from('mihome_security_devices').update({ status: newStatus }).neq('status', 'offline');
    setSystemArmed(!systemArmed);
    setDevices(prev => prev.map(d => d.status !== 'offline' ? { ...d, status: newStatus as any } : d));
  }

  async function toggleAccess(codeId: string, active: boolean) {
    const supabase = createClient();
    await supabase.from('mihome_access_codes').update({ active }).eq('id', codeId);
    setAccessCodes(prev => prev.map(c => c.id === codeId ? { ...c, active } : c));
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  const triggeredDevices = devices.filter(d => d.status === 'triggered');
  const lowBattery = devices.filter(d => d.battery !== null && d.battery < 20);

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Security</h1>
          <p className="text-xs text-gray-500">{devices.length} devices · {events.length} recent events</p>
        </div>
        <button
          onClick={toggleSystem}
          className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all', systemArmed ? 'bg-green-500 text-white' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400')}
        >
          {systemArmed ? '🛡️ Armed' : '⚠️ Disarmed'}
        </button>
      </div>

      {/* Alerts */}
      {triggeredDevices.length > 0 && (
        <div className="card bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 animate-pulse">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">🚨 Alert: {triggeredDevices.length} triggered</p>
          {triggeredDevices.map(d => (
            <p key={d.id} className="text-xs text-red-600 mt-1">{DEVICE_ICONS[d.type]} {d.name} — {d.location}</p>
          ))}
        </div>
      )}

      {lowBattery.length > 0 && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs font-bold text-yellow-700 dark:text-yellow-400">🔋 Low Battery ({lowBattery.length})</p>
          {lowBattery.map(d => (
            <p key={d.id} className="text-xs text-yellow-600 mt-0.5">{d.name}: {d.battery}%</p>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['status', 'events', 'access', 'settings'] as SecurityTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', tab === t ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{t}</button>
        ))}
      </div>

      {/* Status */}
      {tab === 'status' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-16" />) :
            devices.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🔒</p>
                <p className="text-sm text-gray-500">No security devices configured</p>
                <p className="text-xs text-gray-400 mt-1">Add cameras, locks, and sensors</p>
              </div>
            ) : devices.map(device => (
              <div key={device.id} className="card flex items-center gap-3">
                <span className="text-xl">{DEVICE_ICONS[device.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{device.name}</p>
                  <p className="text-xs text-gray-500">{device.location}</p>
                </div>
                <div className="text-right">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded capitalize', STATUS_COLORS[device.status])}>{device.status}</span>
                  {device.battery !== null && <p className="text-[10px] text-gray-400 mt-0.5">🔋 {device.battery}%</p>}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Events */}
      {tab === 'events' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3, 4].map(i => <div key={i} className="card skeleton h-12" />) :
            events.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-sm text-gray-500">No recent security events</p>
              </div>
            ) : events.map(event => (
              <div key={event.id} className="card flex items-center gap-3 py-2.5">
                <span className={cn('text-xs', SEVERITY_COLORS[event.severity])}>
                  {event.severity === 'critical' ? '🔴' : event.severity === 'warning' ? '🟡' : '🔵'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-harbor-800 dark:text-white">{event.message}</p>
                  <p className="text-[10px] text-gray-400">{event.device_name || event.type} · {timeAgo(event.created_at)}</p>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Access Codes */}
      {tab === 'access' && (
        <div className="space-y-3">
          <div className="card text-center py-3">
            <button className="btn-teal text-xs">+ Generate Access Code</button>
          </div>
          {accessCodes.length === 0 ? (
            <div className="card text-center py-6">
              <p className="text-sm text-gray-500">No access codes created</p>
            </div>
          ) : accessCodes.map(code => (
            <div key={code.id} className="card flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{code.name}</p>
                <p className="text-xs text-gray-500 capitalize">{code.type} · Used {code.used_count}x{code.valid_until ? ` · Expires ${new Date(code.valid_until).toLocaleDateString()}` : ''}</p>
              </div>
              <button
                onClick={() => toggleAccess(code.id, !code.active)}
                className={cn('w-10 h-5 rounded-full transition-colors relative', code.active ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600')}
              >
                <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', code.active ? 'left-5' : 'left-0.5')} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="space-y-3">
          {[
            { icon: '🔔', label: 'Push Notifications', desc: 'Get alerted on all events' },
            { icon: '📹', label: 'Motion Recording', desc: 'Auto-record on motion detect' },
            { icon: '🌙', label: 'Night Mode', desc: 'Auto-arm at bedtime' },
            { icon: '📍', label: 'Geofence', desc: 'Arm/disarm based on location' },
            { icon: '👥', label: 'Guest Access', desc: 'Allow temporary entry codes' },
            { icon: '📊', label: 'Activity Reports', desc: 'Weekly security summary' },
          ].map(setting => (
            <div key={setting.label} className="card flex items-center gap-3">
              <span className="text-xl">{setting.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white">{setting.label}</p>
                <p className="text-xs text-gray-500">{setting.desc}</p>
              </div>
              <div className="w-10 h-5 rounded-full bg-gray-300 dark:bg-gray-600 relative cursor-pointer">
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
