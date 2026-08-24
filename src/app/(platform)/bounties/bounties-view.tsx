'use client';

import { useState } from 'react';
import { Search, ExternalLink, Flame, Clock, Code2, Coins } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type Tier = 'small' | 'medium' | 'large' | 'epic';

interface Bounty {
  id: string;
  name: string;
  description: string;
  tier: Tier;
  domain: string;
  priority: string;
}

const TIER_META: Record<Tier, { label: string; range: string; color: string; badge: 'success' | 'mly' | 'default' | 'destructive' }> = {
  small: { label: '🟢 Small', range: '50-150 $MLY', color: 'bg-green-500', badge: 'success' },
  medium: { label: '🟡 Medium', range: '150-500 $MLY', color: 'bg-yellow-500', badge: 'mly' },
  large: { label: '🟠 Large', range: '500-1500 $MLY', color: 'bg-orange-500', badge: 'default' },
  epic: { label: '🔴 Epic', range: '1500-5000 $MLY', color: 'bg-red-500', badge: 'destructive' },
};

const DOMAINS = [
  { key: 'P0', name: 'Coordination', icon: '🧬' },
  { key: 'P1', name: 'Core Platform', icon: '🏗️' },
  { key: 'P2', name: 'Economy', icon: '💰' },
  { key: 'P3', name: 'Social', icon: '👥' },
  { key: 'P4', name: 'Civic', icon: '🏛️' },
  { key: 'P5', name: 'Commerce', icon: '🛒' },
  { key: 'P6', name: 'Media', icon: '🎬' },
  { key: 'P7', name: 'Safety', icon: '🛡️' },
  { key: 'P8', name: 'Education', icon: '📚' },
  { key: 'P9', name: 'Health', icon: '💚' },
  { key: 'P10', name: 'Financial', icon: '🏦' },
  { key: 'P11', name: 'Population', icon: '🤲' },
  { key: 'P12', name: 'Infrastructure', icon: '⚙️' },
  { key: 'P13', name: 'AI', icon: '🤖' },
  { key: 'P14', name: 'Mobile', icon: '📱' },
  { key: 'P15', name: 'Smart Universe', icon: '🌍' },
];

// Curated bounties from the roadmap
const BOUNTIES: Bounty[] = [
  { id: 'P0-01', name: 'MiAction — Common Human-Action Protocol', description: 'Every consequential action wrapped in a standard envelope with actor, intent, scope, receipt, appeal path, offline capability.', tier: 'epic', domain: 'P0', priority: 'critical' },
  { id: 'P0-02', name: 'MiScope — Relationship & Consent Graph', description: 'Who can see what. Who can do what. Household, guardian, care, separation, delegation — all modeled as a graph.', tier: 'epic', domain: 'P0', priority: 'critical' },
  { id: 'P0-03', name: 'MiReceipt — Understandable Proof', description: 'Every action generates a human-readable receipt. Portable. Verifiable.', tier: 'large', domain: 'P0', priority: 'high' },
  { id: 'P1-01', name: 'Animated Citizen Card', description: 'Visual identity card with standing facets, QR code, endorsements, contribution history. Exportable.', tier: 'medium', domain: 'P1', priority: 'high' },
  { id: 'P1-02', name: 'Visual Standing System', description: '8-facet display with decay visualization and attestation UI.', tier: 'large', domain: 'P1', priority: 'high' },
  { id: 'P1-10', name: 'Guest Experience', description: 'Browse without signup. See what\'s available. Convert without pressure.', tier: 'small', domain: 'P1', priority: 'medium' },
  { id: 'P2-01', name: 'Pocket Alive', description: 'Wallet that FEELS alive — particle effects on transactions, $MLY flowing visually.', tier: 'medium', domain: 'P2', priority: 'high' },
  { id: 'P2-02', name: 'Three Pots System', description: 'Spending, savings, community pots with rules and auto-allocation.', tier: 'medium', domain: 'P2', priority: 'high' },
  { id: 'P2-08', name: '$MLY Transaction History (Rich)', description: 'Categorized spending, monthly summaries, trends, export.', tier: 'small', domain: 'P2', priority: 'medium' },
  { id: 'P3-03', name: 'Quick Post (10-Second Content)', description: 'Photo + one line + post. Fastest possible content creation.', tier: 'small', domain: 'P3', priority: 'medium' },
  { id: 'P3-04', name: 'Live Activity Feed (Heartbeat)', description: 'Real-time pulse of community activity. Chronological with priority bubbling.', tier: 'medium', domain: 'P3', priority: 'high' },
  { id: 'P3-05', name: 'Celebrations System', description: 'Confetti, community-wide announcements, milestone celebrations.', tier: 'small', domain: 'P3', priority: 'low' },
  { id: 'P4-02', name: 'Delegation Engine', description: 'Liquid democracy — delegate your vote by topic. Constrained delegation. Revocable.', tier: 'large', domain: 'P4', priority: 'high' },
  { id: 'P4-07', name: 'Petition/Referendum System', description: 'Collect signatures. Trigger votes. Recall leaders. Direct democracy tools.', tier: 'medium', domain: 'P4', priority: 'medium' },
  { id: 'P5-02', name: 'Quests System', description: 'Community tasks that need doing. Claim, complete, earn. Verified by community.', tier: 'large', domain: 'P5', priority: 'high' },
  { id: 'P6-01', name: 'Media Creation (10-second)', description: 'Record → post. Photo + caption → post. Voice note → post. Minimum friction.', tier: 'small', domain: 'P6', priority: 'medium' },
  { id: 'P6-03', name: 'MiBlog — Rich Long-Form', description: 'WYSIWYG editor, series, newsletter, comments, cross-post to forum.', tier: 'medium', domain: 'P6', priority: 'medium' },
  { id: 'P7-02', name: 'Walking-Home Timer', description: 'Timer that alerts contacts if not cancelled. GPS sharing during walk.', tier: 'small', domain: 'P7', priority: 'medium' },
  { id: 'P7-03', name: 'Rights Card', description: 'Your constitutional rights on your phone. Audio playback. Police encounter guidance.', tier: 'small', domain: 'P7', priority: 'medium' },
  { id: 'P8-01', name: 'Learn Alive', description: 'Interactive, gamified learning with streaks, XP, and community cohorts.', tier: 'large', domain: 'P8', priority: 'high' },
  { id: 'P9-05', name: 'Crisis Resources (Live)', description: 'Real-time updated crisis numbers, locations, availability.', tier: 'small', domain: 'P9', priority: 'high' },
  { id: 'P10-04', name: 'Bill Splitting', description: 'Create, add members, track who paid, settle. Recurring splits.', tier: 'medium', domain: 'P10', priority: 'medium' },
  { id: 'P12-02', name: 'Self-Hosted Supabase', description: 'Full Supabase stack on community hardware. Zero dependency on Supabase Inc.', tier: 'large', domain: 'P12', priority: 'high' },
  { id: 'P13-01', name: 'Mi (Front-Door Helper)', description: 'Conversational AI that navigates the platform. "Mi, send $5 to Maria."', tier: 'large', domain: 'P13', priority: 'high' },
  { id: 'P13-05', name: 'RAG over Community Knowledge', description: 'Mi searches wiki, courses, resources, forum with community-specific context.', tier: 'medium', domain: 'P13', priority: 'medium' },
  { id: 'P14-02', name: 'PWA Enhancements', description: 'Install prompt, shortcuts, offline mode, background sync, share target.', tier: 'medium', domain: 'P14', priority: 'high' },
];

export function BountiesView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<Tier | null>(null);

  const filtered = BOUNTIES.filter((b) => {
    const matchSearch = !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDomain = !filterDomain || b.domain === filterDomain;
    const matchTier = !filterTier || b.tier === filterTier;
    return matchSearch && matchDomain && matchTier;
  });

  const totalValue = { small: 13, medium: 52, large: 64, epic: 40 };
  const totalBounties = 160;
  const claimed = 0; // Will be dynamic later

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Bounties</h1>
        <p className="page-subtitle">160 features. Earn $MLY by building what the community needs.</p>
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-harbor-800 dark:text-white">{totalBounties}</p>
          <p className="text-xs text-gray-500">Total Bounties</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-green-600">{totalBounties - claimed}</p>
          <p className="text-xs text-gray-500">Available</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-mly-600">323,950</p>
          <p className="text-xs text-gray-500">Max $MLY Pool</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-teal-600">5%</p>
          <p className="text-xs text-gray-500">Weekly Appreciation</p>
        </Card>
      </div>

      {/* Tier breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-mly-500" aria-hidden="true" />
            Bounty Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['small', 'medium', 'large', 'epic'] as Tier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(filterTier === tier ? null : tier)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  filterTier === tier
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-100 dark:border-harbor-800 hover:border-gray-200'
                }`}
                aria-pressed={filterTier === tier}
              >
                <p className="text-sm font-bold">{TIER_META[tier].label}</p>
                <p className="text-xs text-gray-500">{TIER_META[tier].range}</p>
                <p className="text-xs text-gray-400 mt-1">{totalValue[tier]} bounties</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search + Domain filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bounties by name, ID, or keyword..."
            className="pl-9"
            aria-label="Search bounties"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setFilterDomain(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px] ${
              !filterDomain ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            All
          </button>
          {DOMAINS.map((d) => (
            <button
              key={d.key}
              onClick={() => setFilterDomain(filterDomain === d.key ? null : d.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px] ${
                filterDomain === d.key ? 'bg-teal-500 text-white' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-400'
              }`}
              aria-pressed={filterDomain === d.key}
            >
              {d.icon} {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bounties list */}
      <div className="space-y-3">
        <p className="text-sm text-gray-500">{filtered.length} bounties shown</p>
        {filtered.map((bounty) => {
          const tierMeta = TIER_META[bounty.tier];
          const domain = DOMAINS.find(d => d.key === bounty.domain);
          return (
            <Card key={bounty.id} className="hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <code className="text-xs font-mono text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded">
                        {bounty.id}
                      </code>
                      <Badge variant={tierMeta.badge}>{tierMeta.range}</Badge>
                      {domain && (
                        <span className="text-xs text-gray-500">{domain.icon} {domain.name}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white">
                      {bounty.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{bounty.description}</p>
                  </div>
                  <div className="shrink-0">
                    <a
                      href={`https://github.com/RealMiLyfe/MiLyfe-Platform/issues?q=is%3Aissue+${bounty.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex"
                    >
                      <Button size="sm" variant="outline">
                        <Code2 className="h-3 w-3 mr-1" aria-hidden="true" />
                        Claim
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Priority + appreciation indicator */}
                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50 dark:border-harbor-800">
                  {bounty.priority === 'critical' && (
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <Flame className="h-3 w-3" aria-hidden="true" /> Critical
                    </span>
                  )}
                  {bounty.priority === 'high' && (
                    <span className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                      <Flame className="h-3 w-3" aria-hidden="true" /> High Priority
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" aria-hidden="true" /> +5%/week if unclaimed
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full roadmap link */}
      <Card className="bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
        <CardContent className="py-6 text-center">
          <h3 className="font-bold text-harbor-800 dark:text-white mb-1">Full Roadmap</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            See all 160 bounties with full descriptions, acceptance criteria, and architecture notes.
          </p>
          <a
            href="https://github.com/RealMiLyfe/MiLyfe-Platform/blob/main/BOUNTY_ROADMAP.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="harbor" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              View on GitHub
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
