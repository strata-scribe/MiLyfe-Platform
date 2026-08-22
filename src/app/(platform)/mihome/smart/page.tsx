'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Device {
  id: string;
  home_id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'camera' | 'sensor' | 'speaker' | 'plug' | 'blinds';
  room: string;
  status: 'online' | 'offline';
  state: Record<string, any>;
  last_seen: string;
}

interface Automation {
  id: string;
  home_id: string;
  name: string;
  trigger_type: 'time' | 'device' | 'location' | 'manual';
  trigger_value: string;
  actions: { device_id: string; action: string; value: any }[];
  enabled: boolean;
}

interface Room {
  name: string;
  devices: Device[];
}

const DEVICE_ICONS: Record<string, string> = {
  light: '💡', thermostat: '🌡️', lock: '🔐', camera: '📹',
  sensor: '📡', speaker: '🔊', plug: '🔌', blinds: '🪟',
};

export default function SmartHomePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'rooms' | 'devices' | 'automations'>('rooms');
  const [showAddDevice, setShowAddDevice] = useState(false);

  // Add device form
  const [dName, setDName] = useState('');
  const [dType, setDType] = useState<Device['type']>('light');
  const [dRoom, setDRoom] = useState('');
  const [adding, setAdding] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();
    const { data: d } = await supabase.from('mihome_devices').select('*').order('room');
    if (d) setDevices(d);
    const { data: a } = await supabase.from('mihome_automations').select('*');
    if (a) setAutomations(a);
    setLoading(false);
  }

  async function addDevice() {
    if (!user || !dName.trim() || !dRoom.trim()) return;
    setAdding(true);
    const supabase = createClient();
    await supabase.from('mihome_devices').insert({
      home_id: null, name: dName.trim(), type: dType, room: dRoom.trim(),
      status: 'online', state: {}, last_seen: new Date().toISOString(),
    });
    setDName(''); setDRoom(''); setShowAddDevice(false); setAdding(false);
    loadData();
  }

  async function toggleDevice(device: Device) {
    const supabase = createClient();
    const newState = { ...device.state, on: !device.state?.on };
    await supabase.from('mihome_devices').update({ state: newState }).eq('id', device.id);
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, state: newState } : d));
  }

  async function toggleAutomation(id: string, enabled: boolean) {
    const supabase = createClient();
    await supabase.from('mihome_automations').update({ enabled }).eq('id', id);
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled } : a));
  }

  const rooms: Room[] = devices.reduce<Room[]>((acc, device) => {
    const room = acc.find(r => r.name === device.room);
    if (room) room.devices.push(device);
    else acc.push({ name: device.room, devices: [device] });
    return acc;
  }, []);

  const onlineCount = devices.filter(d => d.status === 'online').length;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/mihome" className="text-gray-400 hover:text-gray-600 text-sm">← MiHome</Link>
          </div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">Smart Home</h1>
          <p className="text-xs text-gray-500">{onlineCount}/{devices.length} devices online</p>
        </div>
        {user && <button onClick={() => setShowAddDevice(!showAddDevice)} className="btn-teal text-xs">+ Device</button>}
      </div>

      {/* Add Device */}
      {showAddDevice && (
        <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
          <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Add Device</h3>
          <input value={dName} onChange={e => setDName(e.target.value)} placeholder="Device name" className="input-field" />
          <select value={dType} onChange={e => setDType(e.target.value as Device['type'])} className="input-field">
            {Object.entries(DEVICE_ICONS).map(([key, icon]) => (
              <option key={key} value={key}>{icon} {key.charAt(0).toUpperCase() + key.slice(1)}</option>
            ))}
          </select>
          <input value={dRoom} onChange={e => setDRoom(e.target.value)} placeholder="Room (e.g., Living Room)" className="input-field" />
          <button onClick={addDevice} disabled={!dName.trim() || !dRoom.trim() || adding} className="btn-teal w-full disabled:opacity-50">
            {adding ? 'Adding...' : 'Add Device'}
          </button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        {(['rooms', 'devices', 'automations'] as const).map(v => (
          <button key={v} onClick={() => setView(v)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all', view === v ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>{v}</button>
        ))}
      </div>

      {/* Rooms View */}
      {view === 'rooms' && (
        <div className="space-y-4">
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-32" />) :
            rooms.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">🏠</p>
                <p className="text-sm text-gray-500">No devices added yet</p>
                <p className="text-xs text-gray-400 mt-1">Add your smart devices to get started</p>
              </div>
            ) : rooms.map(room => (
              <div key={room.name} className="card space-y-3">
                <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{room.name}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {room.devices.map(device => (
                    <button
                      key={device.id}
                      onClick={() => toggleDevice(device)}
                      className={cn(
                        'p-3 rounded-xl border transition-all text-left',
                        device.state?.on
                          ? 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-700'
                          : 'bg-gray-50 border-gray-200 dark:bg-harbor-900 dark:border-harbor-700'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg">{DEVICE_ICONS[device.type]}</span>
                        <span className={cn('w-2 h-2 rounded-full', device.status === 'online' ? 'bg-green-500' : 'bg-gray-400')} />
                      </div>
                      <p className="text-xs font-medium text-harbor-800 dark:text-white mt-2 truncate">{device.name}</p>
                      <p className="text-[10px] text-gray-500">{device.state?.on ? 'On' : 'Off'}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Devices View */}
      {view === 'devices' && (
        <div className="space-y-2">
          {loading ? [1, 2, 3].map(i => <div key={i} className="card skeleton h-14" />) :
            devices.map(device => (
              <div key={device.id} className="card flex items-center gap-3">
                <span className="text-xl">{DEVICE_ICONS[device.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{device.name}</p>
                  <p className="text-xs text-gray-500">{device.room} · {device.type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', device.status === 'online' ? 'bg-green-500' : 'bg-gray-400')} />
                  <button
                    onClick={() => toggleDevice(device)}
                    className={cn('w-10 h-5 rounded-full transition-colors relative', device.state?.on ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600')}
                  >
                    <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', device.state?.on ? 'left-5' : 'left-0.5')} />
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Automations View */}
      {view === 'automations' && (
        <div className="space-y-3">
          {loading ? [1, 2].map(i => <div key={i} className="card skeleton h-20" />) :
            automations.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-2xl mb-2">⚡</p>
                <p className="text-sm text-gray-500">No automations yet</p>
                <p className="text-xs text-gray-400 mt-1">Create routines to automate your home</p>
              </div>
            ) : automations.map(auto => (
              <div key={auto.id} className="card flex items-center gap-3">
                <span className="text-xl">{auto.trigger_type === 'time' ? '⏰' : auto.trigger_type === 'device' ? '🔗' : auto.trigger_type === 'location' ? '📍' : '👆'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{auto.name}</p>
                  <p className="text-xs text-gray-500">{auto.actions.length} action{auto.actions.length !== 1 ? 's' : ''} · {auto.trigger_type} trigger</p>
                </div>
                <button
                  onClick={() => toggleAutomation(auto.id, !auto.enabled)}
                  className={cn('w-10 h-5 rounded-full transition-colors relative', auto.enabled ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600')}
                >
                  <span className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', auto.enabled ? 'left-5' : 'left-0.5')} />
                </button>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
