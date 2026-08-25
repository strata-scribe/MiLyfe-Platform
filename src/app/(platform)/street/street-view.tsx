'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListingCard } from '@/components/street/listing-card';
import { QuestCard } from '@/components/street/quest-card';
import { ResourceCard } from '@/components/street/resource-card';
import { SurplusCard } from '@/components/street/surplus-card';
import { CreateListingModal } from '@/components/street/create-listing-modal';
import { CreateQuestModal } from '@/components/street/create-quest-modal';
import { CreateSurplusModal } from '@/components/street/create-surplus-modal';
import { StreetMap } from '@/components/street/street-map';
import { StreetSearch } from '@/components/street/street-search';

type StreetTab = 'marketplace' | 'quests' | 'resources' | 'surplus' | 'map';

interface StreetViewProps {
  userId: string;
  listings: any[];
  quests: any[];
  resources: any[];
  surplus: any[];
}

export function StreetView({ userId, listings, quests, resources, surplus }: StreetViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StreetTab>('marketplace');
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showCreateQuest, setShowCreateQuest] = useState(false);
  const [showCreateSurplus, setShowCreateSurplus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: StreetTab; label: string; count: number; icon: string }[] = [
    { id: 'marketplace', label: 'Marketplace', count: listings.length, icon: '🛒' },
    { id: 'quests', label: 'Quests', count: quests.length, icon: '⚡' },
    { id: 'resources', label: 'Resources', count: resources.length, icon: '📍' },
    { id: 'surplus', label: 'Surplus', count: surplus.length, icon: '🎁' },
    { id: 'map', label: 'Map', count: 0, icon: '🗺️' },
  ];

  // Filter by search query
  const filteredListings = searchQuery
    ? listings.filter((l: any) => l.title.toLowerCase().includes(searchQuery) || l.description.toLowerCase().includes(searchQuery))
    : listings;
  const filteredQuests = searchQuery
    ? quests.filter((q: any) => q.title.toLowerCase().includes(searchQuery) || q.description.toLowerCase().includes(searchQuery))
    : quests;
  const filteredResources = searchQuery
    ? resources.filter((r: any) => r.name.toLowerCase().includes(searchQuery) || r.description?.toLowerCase().includes(searchQuery))
    : resources;
  const filteredSurplus = searchQuery
    ? surplus.filter((s: any) => s.title.toLowerCase().includes(searchQuery))
    : surplus;

  // Build map pins from all geo-located items
  const mapPins = [
    ...resources.filter((r: any) => r.latitude).map((r: any) => ({ id: r.id, lat: r.latitude, lon: r.longitude, type: 'resource' as const, title: r.name, subtitle: r.category })),
    ...quests.filter((q: any) => q.latitude).map((q: any) => ({ id: q.id, lat: q.latitude, lon: q.longitude, type: 'quest' as const, title: q.title, subtitle: `+${q.reward_mly} $MLY` })),
    ...surplus.filter((s: any) => s.latitude).map((s: any) => ({ id: s.id, lat: s.latitude, lon: s.longitude, type: 'surplus' as const, title: s.title, subtitle: s.pickup_location })),
  ];

  function handleCreated() {
    router.refresh();
  }

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

      {/* Search */}
      <StreetSearch onSearch={setSearchQuery} />

      {/* Content */}
      {activeTab === 'map' && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">
            Resources, quests, and surplus with locations shown on map.
          </p>
          <StreetMap pins={mapPins} />
          {mapPins.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              No geolocated items yet. Items with addresses will appear here.
            </p>
          )}
        </div>
      )}

      {activeTab === 'marketplace' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Buy, sell, and trade with your neighbors
            </p>
            <button
              onClick={() => setShowCreateListing(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              + List Item
            </button>
          </div>
          {filteredListings.length === 0 ? (
            <EmptyState icon="🛒" message="No listings yet. Be the first to list something!" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((listing) => (
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
            <button
              onClick={() => setShowCreateQuest(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              + Post Quest
            </button>
          </div>
          {filteredQuests.length === 0 ? (
            <EmptyState icon="⚡" message="No quests available right now. Post one for your community!" />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredQuests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} userId={userId} onClaimed={handleCreated} />
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
          {filteredResources.length === 0 ? (
            <EmptyState icon="📍" message="No resources listed yet." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filteredResources.map((resource) => (
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
            <button
              onClick={() => setShowCreateSurplus(true)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              + Share Surplus
            </button>
          </div>
          {filteredSurplus.length === 0 ? (
            <EmptyState icon="🎁" message="No surplus items right now. Share something you don't need!" />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredSurplus.map((item) => (
                <SurplusCard key={item.id} item={item} userId={userId} onClaimed={handleCreated} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateListingModal open={showCreateListing} onClose={() => setShowCreateListing(false)} onSuccess={handleCreated} />
      <CreateQuestModal open={showCreateQuest} onClose={() => setShowCreateQuest(false)} onSuccess={handleCreated} />
      <CreateSurplusModal open={showCreateSurplus} onClose={() => setShowCreateSurplus(false)} onSuccess={handleCreated} />
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
