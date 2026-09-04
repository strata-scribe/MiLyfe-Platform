'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, BadgeCheck, AlertTriangle, Info, Calendar } from 'lucide-react';

export interface Author {
  id: string;
  name: string;
  isVerified: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: Author;
  category: 'alert' | 'event' | 'info';
  distanceKm: number; // Distance in kilometers from current location
  createdAt: Date;
  expiresAt: Date;
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Neighborhood Watch Meeting',
    content: 'Monthly neighborhood watch meeting at the community center.',
    author: { id: 'u1', name: 'Alice Smith', isVerified: true },
    category: 'event',
    distanceKm: 2.5,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    expiresAt: new Date(Date.now() + 86400000 * 3), // expires in 3 days
  },
  {
    id: '2',
    title: 'Water Main Break on 5th Ave',
    content: 'Please avoid 5th ave due to a water main break. Crews are on site.',
    author: { id: 'u2', name: 'City Works', isVerified: true },
    category: 'alert',
    distanceKm: 0.8,
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    expiresAt: new Date(Date.now() + 86400000), // expires in 1 day
  },
  {
    id: '3',
    title: 'Lost Golden Retriever',
    content: 'Lost my dog near the park. Wearing a red collar. Answers to Buddy.',
    author: { id: 'u3', name: 'Bob Jones', isVerified: false },
    category: 'info',
    distanceKm: 4.2,
    createdAt: new Date(Date.now() - 86400000 * 2),
    expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago
  },
  {
    id: '4',
    title: 'Food Truck Festival',
    content: 'Downtown food truck festival this weekend!',
    author: { id: 'u4', name: 'Downtown Association', isVerified: true },
    category: 'event',
    distanceKm: 12.0,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000 * 5),
  },
  {
    id: '5',
    title: 'Free Gardening Workshop',
    content: 'Learn how to start a community garden. All are welcome.',
    author: { id: 'u5', name: 'Community Garden Proj', isVerified: false },
    category: 'event',
    distanceKm: 1.5,
    createdAt: new Date(Date.now() - 86400000 * 5),
    expiresAt: new Date(Date.now() - 86400000 * 2), // Expired 2 days ago
  }
];

export function BulletinBoard() {
  const [distanceFilter, setDistanceFilter] = useState<number | null>(5); // Default 5km, null means all
  const [expirationFilter, setExpirationFilter] = useState<'active' | 'expired' | 'all'>('active');

  const filteredAnnouncements = useMemo(() => {
    const now = new Date();
    return mockAnnouncements.filter((announcement) => {
      // Distance filter
      if (distanceFilter !== null && announcement.distanceKm > distanceFilter) {
        return false;
      }

      // Expiration filter
      const isExpired = announcement.expiresAt < now;
      if (expirationFilter === 'active' && isExpired) return false;
      if (expirationFilter === 'expired' && !isExpired) return false;

      return true;
    });
  }, [distanceFilter, expirationFilter]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'event': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'info': return <Info className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'alert': return 'destructive';
      case 'event': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Community Bulletin Board</h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Distance:</span>
            <select
              aria-label="Distance filter"
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-harbor-950"
              value={distanceFilter === null ? 'all' : distanceFilter.toString()}
              onChange={(e) => setDistanceFilter(e.target.value === 'all' ? null : Number(e.target.value))}
            >
              <option value="1">Within 1 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="all">Anywhere</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Status:</span>
            <select
              aria-label="Status filter"
              className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-harbor-950"
              value={expirationFilter}
              onChange={(e) => setExpirationFilter(e.target.value as 'active' | 'expired' | 'all')}
            >
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
              <option value="all">All Announcements</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500">
            No announcements found matching your criteria.
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card key={announcement.id} className={announcement.expiresAt < new Date() ? 'opacity-60' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 items-center">
                    <Badge variant={getCategoryBadgeVariant(announcement.category) as any} className="capitalize">
                      {announcement.category}
                    </Badge>
                    {announcement.expiresAt < new Date() && (
                      <Badge variant="secondary">Expired</Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {announcement.distanceKm} km
                  </div>
                </div>
                <CardTitle className="mt-2 text-lg flex items-center gap-2">
                  {getCategoryIcon(announcement.category)}
                  {announcement.title}
                </CardTitle>
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{announcement.author.name}</span>
                  {announcement.author.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500" aria-label="Verified Author" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-200 text-sm">{announcement.content}</p>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Posted: {formatDate(announcement.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires: {formatDate(announcement.expiresAt)}
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
