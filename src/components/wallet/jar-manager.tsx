'use client';

import { useState, useTransition } from 'react';
import { moveBetweenPots } from '@/lib/actions/wallet';

interface JarManagerProps {
  balance: { spending: number; savings: number; community: number };
  onSuccess: () => void;
}

export function JarManager({ balance, onSuccess }: JarManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState<'spending' | 'savings' | 'community'>('spending');
  const [to, setTo] = useState<'spending' | 'savings' | 'community'>('savings');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleMove() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (from === to) {
      setError('Source and destination must be different');
      return;
    }
    if (numAmount > balance[from]) {
      setError(`Only ${balance[from]} $MLY available in ${from}`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await moveBetweenPots({ from, to, amount: numAmount });
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setAmount('');
        setTimeout(() => {
          setSuccess(false);
          onSuccess();
        }, 1500);
      }
    });
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold">Move Between Pots</h3>

      {/* Visual pots */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <PotDisplay name="Spending" balance={balance.spending} color="bg-blue-100 text-blue-700" />
        <PotDisplay name="Savings" balance={balance.savings} color="bg-green-100 text-green-700" />
        <PotDisplay name="Community" balance={balance.community} color="bg-purple-100 text-purple-700" />
      </div>

      {/* Move form */}
      <div className="flex items-center gap-2">
        <select
          value={from}
          onChange={(e) => setFrom(e.target.value as any)}
          className="rounded-md border px-2 py-1.5 text-sm flex-1"
        >
          <option value="spending">Spending</option>
          <option value="savings">Savings</option>
          <option value="community">Community</option>
        </select>

        <span className="text-muted-foreground text-sm">→</span>

        <select
          value={to}
          onChange={(e) => setTo(e.target.value as any)}
          className="rounded-md border px-2 py-1.5 text-sm flex-1"
        >
          <option value="spending">Spending</option>
          <option value="savings">Savings</option>
          <option value="community">Community</option>
        </select>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          min="1"
          className="rounded-md border px-3 py-1.5 text-sm flex-1"
        />
        <button
          onClick={handleMove}
          disabled={isPending || !amount}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? '...' : 'Move'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && <p className="text-xs text-green-600">Moved successfully ✓</p>}
    </div>
  );
}

function PotDisplay({ name, balance, color }: { name: string; balance: number; color: string }) {
  return (
    <div className={`rounded-lg p-3 ${color}`}>
      <p className="text-xs font-medium opacity-70">{name}</p>
      <p className="text-lg font-bold">{balance}</p>
      <p className="text-xs opacity-60">$MLY</p>
    </div>
  );
}
