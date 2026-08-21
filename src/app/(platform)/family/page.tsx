'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type FamilyTab = 'home' | 'calendar' | 'budget' | 'create';

interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: string;
  display_name?: string;
  last_checkin?: string;
}

interface FamilyEvent {
  id: string;
  family_id: string;
  title: string;
  date: string;
  category: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
}

interface Family {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export default function FamilyPage() {
  const [tab, setTab] = useState<FamilyTab>('home');
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Create family
  const [familyName, setFamilyName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventCategory, setEventCategory] = useState('general');
  const [eventAssigned, setEventAssigned] = useState('');
  const [addingEvent, setAddingEvent] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Check if user is in a family
      const { data: membership } = await supabase
        .from('family_members')
        .select('*, families(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership && membership.families) {
        const fam = membership.families as any;
        setFamily({ id: fam.id, name: fam.name, created_by: fam.created_by, created_at: fam.created_at });

        // Get members
        const { data: mems } = await supabase
          .from('family_members')
          .select('*, profiles(display_name)')
          .eq('family_id', fam.id);
        if (mems) {
          setMembers(mems.map((m: any) => ({
            ...m,
            display_name: m.profiles?.display_name || 'Member',
          })));
        }

        // Get events
        const { data: evts } = await supabase
          .from('family_events')
          .select('*')
          .eq('family_id', fam.id)
          .order('date', { ascending: true });
        if (evts) setEvents(evts);

        // Get family transactions (last 20)
        const memberIds = mems?.map((m: any) => m.user_id) || [];
        if (memberIds.length > 0) {
          const { data: txs } = await supabase
            .from('mly_transactions')
            .select('*')
            .in('from_id', memberIds)
            .order('created_at', { ascending: false })
            .limit(20);
          if (txs) setTransactions(txs);
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    const { data: newFamily } = await supabase
      .from('families')
      .insert({ name: familyName.trim(), created_by: user.id })
      .select()
      .single();

    if (newFamily) {
      await supabase.from('family_members').insert({
        family_id: newFamily.id,
        user_id: user.id,
        role: 'head',
      });
      setFamily(newFamily);
      setMembers([{ id: '', family_id: newFamily.id, user_id: user.id, role: 'head', display_name: user.display_name || 'You' }]);
    }
    setCreating(false);
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family) return;
    setInviting(true);
    setInviteMsg('');

    const { data: invitee } = await supabase
      .from('profiles')
      .select('id, display_name')
      .or(`email.eq.${inviteEmail.trim()},display_name.ilike.${inviteEmail.trim()}`)
      .maybeSingle();

    if (!invitee) {
      setInviteMsg('User not found. They need a MiLyfe account.');
      setInviting(false);
      return;
    }

    const { error } = await supabase.from('family_members').insert({
      family_id: family.id,
      user_id: invitee.id,
      role: inviteRole,
    });

    if (error) {
      setInviteMsg('Already in this family or another error.');
    } else {
      setMembers(prev => [...prev, { id: '', family_id: family.id, user_id: invitee.id, role: inviteRole, display_name: invitee.display_name }]);
      setInviteMsg('Added!');
      setInviteEmail('');
    }
    setInviting(false);
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !family) return;
    setAddingEvent(true);
    const { data } = await supabase.from('family_events').insert({
      family_id: family.id,
      title: eventTitle.trim(),
      date: eventDate,
      category: eventCategory,
      assigned_to: eventAssigned || null,
      created_by: user.id,
    }).select().single();
    if (data) setEvents(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
    setEventTitle('');
    setEventDate('');
    setEventCategory('general');
    setEventAssigned('');
    setAddingEvent(false);
  };

  const categoryIcons: Record<string, string> = {
    general: '📅',
    school: '📚',
    medical: '🏥',
    custody: '👨‍👧',
    work: '💼',
    bill: '💰',
  };

  const roleIcons: Record<string, string> = {
    head: '👑',
    elder: '🧓',
    parent: '👨‍👩‍👧',
    member: '👤',
    child: '🧒',
  };

  const combinedBalance = members.length * 50; // Placeholder visual

  if (loading) return <div className="space-y-4 animate-slide-up">{[1,2,3].map(i => <div key={i} className="card skeleton h-24" />)}</div>;

  // No family state
  if (!family) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div>
          <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiFamily</h1>
          <p className="text-xs text-gray-500">Family hub for coordination, planning, and shared resources.</p>
        </div>

        <div className="card text-center py-8 space-y-4">
          <span className="text-4xl">👨‍👩‍👧‍👦</span>
          <p className="text-sm text-gray-600 dark:text-gray-300">You&apos;re not part of a family circle yet.</p>
          <p className="text-xs text-gray-400">Create one or ask a family member to invite you.</p>
        </div>

        <form onSubmit={createFamily} className="card space-y-3">
          <p className="text-sm font-bold text-harbor-800 dark:text-white">Create Family Circle</p>
          <input
            type="text"
            value={familyName}
            onChange={e => setFamilyName(e.target.value)}
            className="input-field text-sm"
            placeholder="Family name (e.g. The Johnsons)"
            required
          />
          <button type="submit" disabled={creating} className="btn-teal w-full disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Family'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiFamily</h1>
        <p className="text-xs text-gray-500">{family.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {([
          { key: 'home', label: '🏠 Home' },
          { key: 'calendar', label: '📅 Calendar' },
          { key: 'budget', label: '💰 Budget' },
          { key: 'create', label: '➕ Manage' },
        ] as { key: FamilyTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', tab === t.key ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Home */}
      {tab === 'home' && (
        <div className="space-y-4">
          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Family Members</p>
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                  <span className="text-lg">{roleIcons[m.role] || '👤'}</span>
                  <div className="flex-1">
                    <p className="text-sm text-harbor-800 dark:text-white">{m.display_name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{m.role}</p>
                  </div>
                  {m.role === 'elder' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Checked in
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming events preview */}
          {events.length > 0 && (
            <div className="card">
              <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Upcoming</p>
              {events.slice(0, 3).map(ev => (
                <div key={ev.id} className="flex items-center gap-2 py-1.5">
                  <span>{categoryIcons[ev.category] || '📅'}</span>
                  <p className="text-xs text-harbor-800 dark:text-white flex-1">{ev.title}</p>
                  <p className="text-[10px] text-gray-400">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      {tab === 'calendar' && (
        <div className="space-y-4">
          <form onSubmit={addEvent} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Add Event</p>
            <input
              type="text"
              value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              className="input-field text-sm"
              placeholder="Event title"
              required
            />
            <input
              type="date"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="input-field text-sm"
              required
            />
            <select
              value={eventCategory}
              onChange={e => setEventCategory(e.target.value)}
              className="input-field text-sm"
            >
              <option value="general">General</option>
              <option value="school">School</option>
              <option value="medical">Medical</option>
              <option value="custody">Custody</option>
              <option value="work">Work</option>
              <option value="bill">Bill Due</option>
            </select>
            <select
              value={eventAssigned}
              onChange={e => setEventAssigned(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Assign to (optional)</option>
              {members.map((m, i) => (
                <option key={i} value={m.user_id}>{m.display_name}</option>
              ))}
            </select>
            <button type="submit" disabled={addingEvent} className="btn-teal w-full text-sm disabled:opacity-50">
              {addingEvent ? 'Adding...' : 'Add Event'}
            </button>
          </form>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">All Events</p>
            {events.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-xs">No events yet. Add one above!</p>
            ) : events.map(ev => (
              <div key={ev.id} className="card flex items-center gap-3 !py-3">
                <span className="text-lg">{categoryIcons[ev.category] || '📅'}</span>
                <div className="flex-1">
                  <p className="text-sm text-harbor-800 dark:text-white">{ev.title}</p>
                  <p className="text-[10px] text-gray-400">{new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-harbor-800 text-gray-500 capitalize">{ev.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget */}
      {tab === 'budget' && (
        <div className="space-y-4">
          <div className="card bg-gradient-to-br from-harbor-800 to-teal-700 text-white p-5">
            <p className="text-xs text-harbor-200">Shared Family Pool (conceptual)</p>
            <p className="text-3xl font-bold mt-1">${combinedBalance} MLY</p>
            <p className="text-xs text-harbor-300 mt-1">{members.length} members combined</p>
          </div>

          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-3">Recent Family Spending</p>
            {transactions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No transactions to show.</p>
            ) : transactions.slice(0, 10).map((tx: any) => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                <span className="text-sm">💸</span>
                <div className="flex-1">
                  <p className="text-xs text-harbor-800 dark:text-white">{tx.description || tx.type}</p>
                  <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-bold text-red-400">-${tx.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create/Manage */}
      {tab === 'create' && (
        <div className="space-y-4">
          <form onSubmit={inviteMember} className="card space-y-3">
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Invite Member</p>
            {inviteMsg && <p className={cn('text-xs font-medium', inviteMsg === 'Added!' ? 'text-teal-500' : 'text-red-500')}>{inviteMsg}</p>}
            <input
              type="text"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="input-field text-sm"
              placeholder="Email or display name"
              required
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="input-field text-sm"
            >
              <option value="member">Member</option>
              <option value="elder">Elder</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
            </select>
            <button type="submit" disabled={inviting} className="btn-primary w-full text-sm disabled:opacity-50">
              {inviting ? 'Adding...' : 'Add to Family'}
            </button>
          </form>

          <div className="card">
            <p className="text-sm font-bold text-harbor-800 dark:text-white mb-2">Family Info</p>
            <p className="text-xs text-gray-500">Name: {family.name}</p>
            <p className="text-xs text-gray-500">Members: {members.length}</p>
            <p className="text-xs text-gray-500">Created: {new Date(family.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
