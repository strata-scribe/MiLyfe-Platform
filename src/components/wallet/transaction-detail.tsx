'use client';

interface Transaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  type: string;
  pot: string;
  description: string;
  created_at: string;
}

interface TransactionDetailProps {
  transaction: Transaction;
  userId: string;
  onClose: () => void;
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  ubi: { label: 'UBI Distribution', icon: '🌱' },
  transfer: { label: 'Transfer', icon: '💸' },
  reward: { label: 'Reward', icon: '🏆' },
  spend: { label: 'Spend', icon: '🛒' },
  burn: { label: 'Burn', icon: '🔥' },
  community_contribution: { label: 'Community Contribution', icon: '🤝' },
};

export function TransactionDetail({ transaction, userId, onClose }: TransactionDetailProps) {
  const isIncoming = transaction.to_user_id === userId;
  const typeInfo = TYPE_LABELS[transaction.type] || { label: transaction.type, icon: '📄' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction Detail</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Amount */}
        <div className="text-center py-4">
          <span className="text-4xl">{typeInfo.icon}</span>
          <p className={`text-3xl font-bold mt-2 ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
            {isIncoming ? '+' : '-'}{transaction.amount} $MLY
          </p>
          <p className="text-sm text-muted-foreground mt-1">{typeInfo.label}</p>
        </div>

        {/* Details */}
        <div className="space-y-3 border-t pt-4">
          <DetailRow label="Type" value={typeInfo.label} />
          <DetailRow label="Pot" value={transaction.pot} />
          <DetailRow label="Direction" value={isIncoming ? 'Received' : 'Sent'} />
          {transaction.description && (
            <DetailRow label="Description" value={transaction.description} />
          )}
          <DetailRow
            label="Date"
            value={new Date(transaction.created_at).toLocaleString()}
          />
          <DetailRow label="ID" value={transaction.id.slice(0, 8) + '...'} />
        </div>

        {/* Receipt note */}
        <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p>This transaction is recorded permanently. You can export your full history from Settings at any time.</p>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-md border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
