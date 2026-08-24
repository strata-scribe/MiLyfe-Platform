'use client';

import { useState } from 'react';
import { Grid3X3, Search, Star, Download, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'utility', label: 'Utility' },
  { value: 'social', label: 'Social' },
  { value: 'economy', label: 'Economy' },
  { value: 'governance', label: 'Governance' },
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'safety', label: 'Safety' },
  { value: 'media', label: 'Media' },
];

interface Props {
  apps: any[];
}

export function AppsView({ apps }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const filteredApps = apps.filter((app) => {
    const matchesSearch = !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || app.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Apps</h1>
        <p className="page-subtitle">Community-built tools and services</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search apps..."
          className="pl-9"
          aria-label="Search apps"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1" role="list" aria-label="Category filters">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterCategory(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px] min-w-[32px] ${
              filterCategory === value
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-harbor-700'
            }`}
            aria-pressed={filterCategory === value}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Apps grid */}
      {filteredApps.length === 0 ? (
        <EmptyState
          icon={Grid3X3}
          title="No apps found"
          description={searchQuery ? 'Try a different search term.' : 'Community apps will appear here as developers publish them.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredApps.map((app) => (
            <Card key={app.id} className="hover:border-teal-200 dark:hover:border-teal-800 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
                      <Grid3X3 className="h-6 w-6 text-teal-500" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-harbor-800 dark:text-white truncate">
                      {app.name}
                    </h3>
                    <Badge variant="secondary" className="capitalize text-[10px] mt-0.5">
                      {app.category}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-harbor-800">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {app.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-mly-500 fill-mly-500" aria-hidden="true" />
                        {app.rating.toFixed(1)}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5">
                      <Download className="h-3 w-3" aria-hidden="true" />
                      {app.install_count}
                    </span>
                  </div>
                  {app.url && (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline font-medium"
                    >
                      Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bounty CTA */}
      <Card className="bg-harbor-50 dark:bg-harbor-900 border-harbor-200 dark:border-harbor-700">
        <CardContent className="py-6 text-center">
          <h3 className="font-bold text-harbor-800 dark:text-white mb-1">Build an App</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Developers earn $MLY bounties for building community apps. Check the bounty roadmap.
          </p>
          <a href="/bounties">
            <Button variant="harbor" size="sm">
              View Bounties
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
