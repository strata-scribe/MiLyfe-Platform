export interface Transaction {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  amount: number;
  type: string;
  pot: string;
  description: string;
  created_at: string;
}

export type TransactionCategory =
  | 'Spend'
  | 'Reward'
  | 'Transfer'
  | 'Burn'
  | 'UBI'
  | 'Community Contribution'
  | 'Unknown';

export function categorizeTransaction(tx: Transaction): TransactionCategory {
  switch (tx.type) {
    case 'ubi':
      return 'UBI';
    case 'transfer':
      return 'Transfer';
    case 'reward':
      return 'Reward';
    case 'spend':
      return 'Spend';
    case 'burn':
      return 'Burn';
    case 'community_contribution':
      return 'Community Contribution';
    default:
      return 'Unknown';
  }
}

export interface MonthlySummary {
  month: string;
  year: number;
  totalIncoming: number;
  totalOutgoing: number;
  categories: Partial<Record<TransactionCategory, { incoming: number; outgoing: number }>>;
}

export function getMonthlySummary(transactions: Transaction[], userId: string): MonthlySummary[] {
  const summaryMap: Record<string, MonthlySummary> = {};

  for (const tx of transactions) {
    const date = new Date(tx.created_at);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const key = `${year}-${date.getMonth()}`;

    if (!summaryMap[key]) {
      summaryMap[key] = {
        month,
        year,
        totalIncoming: 0,
        totalOutgoing: 0,
        categories: {},
      };
    }

    const summary = summaryMap[key];
    const category = categorizeTransaction(tx);
    const isIncoming = tx.to_user_id === userId;

    if (!summary.categories[category]) {
      summary.categories[category] = { incoming: 0, outgoing: 0 };
    }

    if (isIncoming) {
      summary.totalIncoming += tx.amount;
      summary.categories[category]!.incoming += tx.amount;
    } else {
      summary.totalOutgoing += tx.amount;
      summary.categories[category]!.outgoing += tx.amount;
    }
  }

  return Object.values(summaryMap).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const aDate = new Date(`${a.month} 1, ${a.year}`);
    const bDate = new Date(`${b.month} 1, ${b.year}`);
    return bDate.getTime() - aDate.getTime();
  });
}

export function exportToCSV(transactions: Transaction[], userId: string): string {
  if (!transactions.length) return '';

  const headers = ['ID', 'Date', 'Type', 'Category', 'Direction', 'Amount', 'Pot', 'Description'];
  const rows = transactions.map((tx) => {
    const isIncoming = tx.to_user_id === userId;
    const category = categorizeTransaction(tx);
    const direction = isIncoming ? 'Incoming' : 'Outgoing';
    const amount = isIncoming ? tx.amount : -tx.amount;
    const date = new Date(tx.created_at).toISOString();

    return [
      tx.id,
      date,
      tx.type,
      category,
      direction,
      amount,
      tx.pot,
      `"${tx.description.replace(/"/g, '""')}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function exportToJSON(transactions: Transaction[], userId: string): string {
  const enrichedTransactions = transactions.map(tx => ({
    ...tx,
    category: categorizeTransaction(tx),
    direction: tx.to_user_id === userId ? 'Incoming' : 'Outgoing'
  }));
  return JSON.stringify(enrichedTransactions, null, 2);
}
