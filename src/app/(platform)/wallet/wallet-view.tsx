'use client';

import { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, PiggyBank, Heart, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/types/database';

interface Props {
  userId: string;
  wallet: Tables<'wallets'> | null;
  transactions: Tables<'transactions'>[];
  treasury: Tables<'community_treasury'> | null;
}

export function WalletView({ userId, wallet, transactions, treasury }: Props) {
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [sending, setSending] = useState(false);

  const totalBalance = wallet
    ? wallet.spending_balance + wallet.savings_balance + wallet.community_balance
    : 0;

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!transferTo || !transferAmount) return;

    setSending(true);
    const supabase = createClient();

    // Look up recipient by username
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', transferTo)
      .single();

    if (!recipient) {
      toast.error('User not found');
      setSending(false);
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      setSending(false);
      return;
    }

    if (wallet && amount > wallet.spending_balance) {
      toast.error('Insufficient spending balance');
      setSending(false);
      return;
    }

    // Create transaction record
    const { error } = await supabase.from('transactions').insert({
      from_user_id: userId,
      to_user_id: recipient.id,
      amount,
      type: 'transfer',
      pot: 'spending',
      description: `Transfer to @${transferTo}`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Sent ${amount} $MLY to @${transferTo}`);
      setTransferTo('');
      setTransferAmount('');
    }
    setSending(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Wallet</h1>
        <p className="page-subtitle">Your $MLY — earn, save, give</p>
      </div>

      {/* Balance overview */}
      <Card className="bg-gradient-to-br from-harbor-800 to-harbor-900 text-white border-0">
        <CardContent className="py-6">
          <div className="text-center mb-6">
            <p className="text-harbor-200 text-sm mb-1">Total Balance</p>
            <p className="text-4xl font-bold">{totalBalance.toFixed(2)} <span className="text-mly-400 text-lg">$MLY</span></p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wallet className="h-3.5 w-3.5 text-teal-400" aria-hidden="true" />
                <span className="text-xs text-harbor-200">Spending</span>
              </div>
              <p className="font-bold text-sm">{wallet?.spending_balance.toFixed(2) || '0.00'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <PiggyBank className="h-3.5 w-3.5 text-mly-400" aria-hidden="true" />
                <span className="text-xs text-harbor-200">Savings</span>
              </div>
              <p className="font-bold text-sm">{wallet?.savings_balance.toFixed(2) || '0.00'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="h-3.5 w-3.5 text-pink-400" aria-hidden="true" />
                <span className="text-xs text-harbor-200">Community</span>
              </div>
              <p className="font-bold text-sm">{wallet?.community_balance.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send $MLY */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-teal-500" aria-hidden="true" />
            Send $MLY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransfer} className="flex flex-col sm:flex-row gap-2">
            <Input
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value.toLowerCase())}
              placeholder="Username"
              aria-label="Recipient username"
              className="flex-1"
            />
            <Input
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount"
              type="number"
              min="0.01"
              step="0.01"
              aria-label="Amount to send"
              className="w-28"
            />
            <Button type="submit" disabled={sending} variant="mly">
              {sending ? '...' : 'Send'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No transactions yet</p>
          ) : (
            <ul className="space-y-3" aria-label="Transaction history">
              {transactions.map((tx) => {
                const isIncoming = tx.to_user_id === userId;
                return (
                  <li key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isIncoming ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        {isIncoming
                          ? <ArrowDownLeft className="h-4 w-4 text-green-600" aria-hidden="true" />
                          : <ArrowUpRight className="h-4 w-4 text-red-500" aria-hidden="true" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-harbor-800 dark:text-white capitalize">{tx.type}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isIncoming ? 'text-green-600' : 'text-red-500'}`}>
                      {isIncoming ? '+' : '-'}{tx.amount} $MLY
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Treasury */}
      {treasury && (
        <Card>
          <CardHeader>
            <CardTitle>Community Treasury</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-harbor-800 dark:text-white">{treasury.balance.toFixed(0)}</p>
                <p className="text-xs text-gray-500">Balance</p>
              </div>
              <div>
                <p className="text-lg font-bold text-harbor-800 dark:text-white">{treasury.total_distributed.toFixed(0)}</p>
                <p className="text-xs text-gray-500">Distributed</p>
              </div>
              <div>
                <p className="text-lg font-bold text-harbor-800 dark:text-white">{treasury.citizen_count}</p>
                <p className="text-xs text-gray-500">Citizens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
