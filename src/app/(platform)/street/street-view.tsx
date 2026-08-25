'use client';

import { useState } from 'react';
import { ListingCard } from '@/components/street/listing-card';
import { QuestCard } from '@/components/street/quest-card';
import { ResourceCard } from '@/components/street/resource-card';
import { SurplusCard } from '@/components/street/surplus-card';

type StreetTab = 'marketplace' | 'quests' | 'resources' | 'surplus';

interface StreetViewProps {
  userId: string;
  listings: any[];
  quests: any[];
  resources: any[];
  surplus: any[];
}

export function StreetView({ userId, listings, quests, resources, surplus }: StreetViewProps) {
  const [activeTab, setActiveTab] = useState<StreetTab>('marketplace');

  const tabs: { id: StreetTab; label: string; count: number; icon: string }[] = [
    { id: 'marketplace', label: 'Marketplace', count: listings.length, icon: '🛒' },
    { id: 'quests', label: 'Quests', count: quests.length, icon: '⚡' },
    { id: 'resources', label: 'Resources', count: resources.length, icon: '📍' },
    { id: 'surplus', label: 'Surplus', count: surplus.length, icon: '🎁' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Street</h1>
        <p className="text-muted-foreground">
          Your neighborhood. What's nearby. What's happening. What's needed.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-background'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Buy, sell, and trade with your neighbors
            </p>
            <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
              + List Item
            </button>
          </div>
          {listings.length === 0 ? (
            <EmptyState icon="🛒" message="No listings yet. Be the first to list something!" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'quests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Real tasks that improve the community. Complete them, earn $MLY.
            </p>
            <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
              + Post Quest
            </button>
          </div>
          {quests.length === 0 ? (
            <EmptyState icon="⚡" message="No quests available right now. Post one for your community!" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} userId={userId} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Shelters, food banks, legal aid, clinics — with freshness dates so you know what's current.
          </p>
          {resources.length === 0 ? (
            <EmptyState icon="📍" message="No resources listed yet." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'surplus' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Free stuff — food about to expire, items people don't need. Grab it before it's gone.
            </p>
            <button className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
              + Share Surplus
            </button>
          </div>
          {surplus.length === 0 ? (
            <EmptyState icon="🎁" message="No surplus items right now. Share something you don't need!" />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {surplus.map((item) => (
                <SurplusCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="text-4xl">{icon}</p>
      <p className="mt-2 text-muted-foreground">{message}</p>
    </div>
  );
}
