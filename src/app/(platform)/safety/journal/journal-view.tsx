'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { encryptText, decryptText, isCryptoAvailable } from '@/lib/safety/crypto';

interface Entry {
  id: string;
  content_type: string;
  created_at: string;
}

interface JournalViewProps {
  userId: string;
  entries: Entry[];
}

export function JournalView({ userId, entries }: JournalViewProps) {
  const router = useRouter();
  const [passphrase, setPassphrase] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [decryptedEntries, setDecryptedEntries] = useState<Map<string, string>>(new Map());

  if (!isCryptoAvailable()) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Your browser does not support encryption. Use a modern browser (Chrome, Firefox, Safari).</p>
      </div>
    );
  }

  function handleUnlock() {
    if (passphrase.length < 4) {
      setError('Passphrase must be at least 4 characters');
      return;
    }
    setUnlocked(true);
    setError(null);
  }

  async function handleSave() {
    if (!newEntry.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const encrypted = await encryptText(newEntry, passphrase);

        const res = await fetch('/api/safety/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ encrypted_content: encrypted, content_type: 'note' }),
        });

        if (res.ok) {
          setNewEntry('');
          router.refresh();
        } else {
          setError('Failed to save entry');
        }
      } catch {
        setError('Encryption failed');
      }
    });
  }

  async function handleDecrypt(entryId: string) {
    try {
      const res = await fetch(`/api/safety/journal?id=${entryId}`);
      const data = await res.json();

      if (data.encrypted_content) {
        const decrypted = await decryptText(data.encrypted_content, passphrase);
        setDecryptedEntries(prev => new Map(prev).set(entryId, decrypted));
      }
    } catch {
      setError('Failed to decrypt. Wrong passphrase?');
    }
  }

  // Locked state
  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <button onClick={() => router.push('/safety')} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Safety
        </button>

        <div className="rounded-lg border p-6 text-center space-y-4">
          <span className="text-4xl">🔒</span>
          <h1 className="text-xl font-bold">Encrypted Journal</h1>
          <p className="text-sm text-muted-foreground">
            Only you can read this. Enter a passphrase to unlock.
            The server cannot see your entries.
          </p>

          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Your secret passphrase"
            className="w-full rounded-md border px-4 py-2.5 text-center"
            autoFocus
          />

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleUnlock}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Unlock Journal
          </button>

          <p className="text-xs text-muted-foreground">
            If you forget this passphrase, your entries cannot be recovered.
            That's by design — no one else can read them either.
          </p>
        </div>
      </div>
    );
  }

  // Unlocked state
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/safety')} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Safety
          </button>
          <h1 className="text-xl font-bold mt-1">🔓 Journal (Unlocked)</h1>
        </div>
        <button
          onClick={() => { setUnlocked(false); setPassphrase(''); setDecryptedEntries(new Map()); }}
          className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
        >
          Lock 🔒
        </button>
      </div>

      {/* New entry */}
      <div className="rounded-lg border p-4 space-y-3">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Write privately. Document what happened, how you feel, what you need. No one can read this but you."
          className="w-full rounded-md border px-3 py-2 text-sm min-h-[120px] resize-y"
          rows={5}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Encrypted with AES-256-GCM before leaving your device</p>
          <button
            onClick={handleSave}
            disabled={!newEntry.trim() || isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Encrypting...' : 'Save Entry'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {/* Entry list */}
      <div className="space-y-3">
        <h2 className="font-semibold">Past Entries ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries yet. Your first entry is private and encrypted.</p>
        ) : (
          entries.map((entry) => {
            const decrypted = decryptedEntries.get(entry.id);
            return (
              <div key={entry.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="capitalize">{entry.content_type}</span>
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                </div>
                {decrypted ? (
                  <p className="text-sm whitespace-pre-wrap">{decrypted}</p>
                ) : (
                  <button
                    onClick={() => handleDecrypt(entry.id)}
                    className="text-sm text-primary hover:underline"
                  >
                    🔑 Tap to decrypt
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
