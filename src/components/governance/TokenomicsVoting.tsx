'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createProposal } from '@/lib/actions/governance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface TokenomicsVotingProps {
  onSuccess?: () => void;
}

export function TokenomicsVoting({ onSuccess }: TokenomicsVotingProps) {
  const [isPending, startTransition] = useTransition();

  const currentUbi = 50;
  const currentDecay = 5;
  const currentBurn = 10;

  const [ubiRate, setUbiRate] = useState(currentUbi);
  const [decayRate, setDecayRate] = useState(currentDecay);
  const [burnRate, setBurnRate] = useState(currentBurn);

  const handlePropose = () => {
    if (ubiRate === currentUbi && decayRate === currentDecay && burnRate === currentBurn) {
      toast.error('No changes proposed.');
      return;
    }

    const title = 'Update Tokenomics Parameters';
    const body = `
      <h2>Proposed Tokenomics Changes</h2>
      <ul>
        <li><strong>UBI Rate:</strong> ${currentUbi} $MLY/day ➔ <strong>${ubiRate} $MLY/day</strong></li>
        <li><strong>Decay Rate:</strong> ${currentDecay}% ➔ <strong>${decayRate}%</strong></li>
        <li><strong>Burn Percentage:</strong> ${currentBurn}% ➔ <strong>${burnRate}%</strong></li>
      </ul>
      <p>These changes are proposed to balance the community economy.</p>
    `;

    startTransition(async () => {
      const result = await createProposal({
        title,
        body,
        category: 'policy',
        voting_days: 14,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Tokenomics proposal submitted!');
        onSuccess?.();
      }
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tokenomics Governance</CardTitle>
        <CardDescription>
          Propose changes to the community's economic parameters. A vote will be required to pass these changes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* UBI Rate */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-harbor-800 dark:text-gray-200">UBI Rate ($MLY/day)</label>
            <span className="text-sm">
              <span className="text-gray-500">Current: {currentUbi}</span>
              <span className="mx-2">➔</span>
              <span className={cn('font-bold', ubiRate !== currentUbi ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500')}>
                {ubiRate}
              </span>
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            step="5"
            value={ubiRate}
            onChange={(e) => setUbiRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-harbor-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
        </div>

        {/* Decay Rate */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-harbor-800 dark:text-gray-200">Decay Rate (%)</label>
            <span className="text-sm">
              <span className="text-gray-500">Current: {currentDecay}%</span>
              <span className="mx-2">➔</span>
              <span className={cn('font-bold', decayRate !== currentDecay ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500')}>
                {decayRate}%
              </span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={decayRate}
            onChange={(e) => setDecayRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-harbor-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
        </div>

        {/* Burn Rate */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-harbor-800 dark:text-gray-200">Burn Percentage (%)</label>
            <span className="text-sm">
              <span className="text-gray-500">Current: {currentBurn}%</span>
              <span className="mx-2">➔</span>
              <span className={cn('font-bold', burnRate !== currentBurn ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500')}>
                {burnRate}%
              </span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={burnRate}
            onChange={(e) => setBurnRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-harbor-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handlePropose} disabled={isPending || (ubiRate === currentUbi && decayRate === currentDecay && burnRate === currentBurn)} className="w-full">
          {isPending ? 'Submitting...' : 'Propose Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}
