'use client';

import { useState } from 'react';

interface SafetyContact {
  id: string;
  contact_name: string;
  contact_phone: string | null;
  contact_user_id: string | null;
  relationship: string;
  notify_on_leave_now: boolean;
  notify_on_timer_expire: boolean;
}

interface SafetyContactsProps {
  contacts: SafetyContact[];
  onUpdate: () => void;
}

export function SafetyContacts({ contacts, onUpdate }: SafetyContactsProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  async function handleAdd() {
    if (!name.trim()) return;
    const res = await fetch('/api/safety/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_name: name, contact_phone: phone || null }),
    });
    if (res.ok) {
      setName('');
      setPhone('');
      setAdding(false);
      onUpdate();
    }
  }

  async function handleRemove(contactId: string) {
    await fetch(`/api/safety/contacts?id=${contactId}`, { method: 'DELETE' });
    onUpdate();
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">
          No safety contacts yet. Add people you trust who should be notified in an emergency.
        </p>
      )}

      {/* Contact list */}
      {contacts.map((contact) => (
        <div key={contact.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <div>
            <p className="text-sm font-medium">{contact.contact_name}</p>
            <p className="text-xs text-muted-foreground">
              {[
                contact.notify_on_leave_now && 'Leave-Now',
                contact.notify_on_timer_expire && 'Walk-Home',
              ].filter(Boolean).join(' + ') || 'No notifications'}
            </p>
          </div>
          <button
            onClick={() => handleRemove(contact.id)}
            className="text-xs text-muted-foreground hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ))}

      {/* Add form */}
      {adding ? (
        <div className="space-y-2 rounded-md border p-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              Add Contact
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-md border border-dashed py-2 text-sm text-muted-foreground hover:bg-muted/50"
        >
          + Add Safety Contact
        </button>
      )}
    </div>
  );
}
