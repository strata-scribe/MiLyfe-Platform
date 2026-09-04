'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AnimatedBalance } from './animated-balance';
import { SendFlow } from './send-flow';
import { Copy, QrCode, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface WalletCardProps {
  balances: {
    spending: number;
    savings: number;
    community: number;
  };
  username: string;
}

export function WalletCard({ balances, username }: WalletCardProps) {
  const [sendOpen, setSendOpen] = React.useState(false);
  const [receiveOpen, setReceiveOpen] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`@${username}`);
    // Optional: add a toast notification here
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>My Wallet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-harbor-900 rounded-lg">
            <AnimatedBalance value={balances.spending} label="Liquid" color="#10b981" />
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-harbor-900 rounded-lg">
            <AnimatedBalance value={balances.savings} label="Locked Savings" color="#3b82f6" />
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-harbor-900 rounded-lg">
            <AnimatedBalance value={balances.community} label="Community" color="#8b5cf6" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center gap-4 border-t border-gray-100 dark:border-harbor-800 pt-4">
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="flex-1 max-w-[160px] gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Send
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Funds</DialogTitle>
            </DialogHeader>
            <SendFlow
              balance={balances}
              onSuccess={() => setSendOpen(false)}
              onCancel={() => setSendOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 max-w-[160px] gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              Receive
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md text-center">
            <DialogHeader>
              <DialogTitle>Receive Funds</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="flex items-center justify-center w-32 h-32 bg-gray-100 dark:bg-harbor-800 rounded-xl">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-muted-foreground">Your MLY ID</p>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-harbor-900 rounded-lg border border-gray-200 dark:border-harbor-700">
                  <span className="font-mono font-medium text-lg">@{username}</span>
                  <Button variant="ghost" size="icon" onClick={handleCopy}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
