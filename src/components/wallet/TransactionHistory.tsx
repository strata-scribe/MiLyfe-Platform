'use client';

import { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Transaction,
  categorizeTransaction,
  getMonthlySummary,
  exportToCSV,
  exportToJSON
} from '@/lib/wallet/transactions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TransactionDetail } from './transaction-detail';

interface TransactionHistoryProps {
  initialTransactions: Transaction[];
  userId: string;
}

export function TransactionHistory({ initialTransactions, userId }: TransactionHistoryProps) {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const monthlySummary = getMonthlySummary(initialTransactions, userId);

  const handleExportCSV = () => {
    const csvContent = exportToCSV(initialTransactions, userId);
    if (!csvContent) return;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaction_history.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonContent = exportToJSON(initialTransactions, userId);
    if (!jsonContent) return;

    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'transaction_history.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-lg border bg-background flex flex-col h-full">
      <div className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <p className="text-sm text-muted-foreground">{initialTransactions.length} total transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download className="mr-2 h-4 w-4" /> JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <div className="px-4 py-2 border-b">
          <TabsList>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="history" className="p-0 m-0">
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {initialTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No transactions yet
              </p>
            ) : (
              initialTransactions.map((tx) => {
                const isIncoming = tx.to_user_id === userId;
                const category = categorizeTransaction(tx);
                return (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-1.5 ${isIncoming ? 'bg-green-100' : 'bg-red-100'}`}>
                        {isIncoming
                          ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                          : <ArrowUpRight className="h-4 w-4 text-red-500" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium">{category}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isIncoming ? 'text-green-600' : 'text-red-500'}`}>
                      {isIncoming ? '+' : '-'}{tx.amount} $MLY
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="p-4 m-0 space-y-6 max-h-[600px] overflow-y-auto">
          {monthlySummary.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No summary data available
            </p>
          ) : (
            monthlySummary.map((summary) => (
              <div key={`${summary.year}-${summary.month}`} className="border rounded-lg p-4 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-semibold text-lg">{summary.month} {summary.year}</h3>
                  <div className="text-sm font-medium flex gap-4">
                    <span className="text-green-600">In: +{summary.totalIncoming}</span>
                    <span className="text-red-500">Out: -{summary.totalOutgoing}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">By Category:</h4>
                  <div className="grid gap-2 text-sm">
                    {Object.entries(summary.categories).map(([category, stats]) => {
                      if (!stats) return null;
                      return (
                        <div key={category} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                          <span className="font-medium">{category}</span>
                          <div className="flex gap-3 text-xs">
                            {stats.incoming > 0 && (
                              <span className="text-green-600">+{stats.incoming}</span>
                            )}
                            {stats.outgoing > 0 && (
                              <span className="text-red-500">-{stats.outgoing}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {selectedTx && (
        <TransactionDetail
          transaction={selectedTx}
          userId={userId}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
