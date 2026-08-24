'use client';

import { Star, Users, Heart, Hammer, GraduationCap, Shield, Megaphone, ShoppingBag, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/types/database';

const FACETS = [
  { key: 'neighbor', label: 'Neighbor', icon: Users, color: 'text-blue-500', description: 'Community presence & participation' },
  { key: 'carer', label: 'Carer', icon: Heart, color: 'text-pink-500', description: 'Care for others, mutual aid' },
  { key: 'maker', label: 'Maker', icon: Hammer, color: 'text-orange-500', description: 'Building, creating, contributing code' },
  { key: 'teacher', label: 'Teacher', icon: GraduationCap, color: 'text-purple-500', description: 'Teaching, mentoring, sharing knowledge' },
  { key: 'keeper', label: 'Keeper', icon: Shield, color: 'text-green-500', description: 'Moderation, safety, stewardship' },
  { key: 'voice', label: 'Voice', icon: Megaphone, color: 'text-teal-500', description: 'Governance participation, civic engagement' },
  { key: 'shop', label: 'Shop', icon: ShoppingBag, color: 'text-mly-600', description: 'Commerce, fair dealing, business' },
  { key: 'helper', label: 'Helper', icon: HelpCircle, color: 'text-indigo-500', description: 'Supporting others, answering questions' },
] as const;

interface Props {
  standing: Tables<'standing'> | null;
  attestations: any[];
  profile: { display_name: string; username: string } | null;
}

export function StandingView({ standing, attestations, profile }: Props) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Standing</h1>
        <p className="page-subtitle">Your reputation, earned through action</p>
      </div>

      {/* Overall score */}
      <Card className="text-center">
        <CardContent className="py-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-teal-50 dark:bg-teal-900/20 mb-3">
            <Star className="h-10 w-10 text-teal-500" aria-hidden="true" />
          </div>
          <p className="text-3xl font-bold text-harbor-800 dark:text-white">
            {standing?.overall?.toFixed(1) || '0.0'}
          </p>
          <p className="text-sm text-gray-500">
            Overall Standing — {profile?.display_name || 'Citizen'}
          </p>
        </CardContent>
      </Card>

      {/* 8 facets */}
      <Card>
        <CardHeader>
          <CardTitle>8 Facets of Reputation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {FACETS.map(({ key, label, icon: Icon, color, description }) => {
              const value = standing ? (standing as any)[key] : 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
                      <span className="text-sm font-medium text-harbor-800 dark:text-white">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-harbor-800 dark:text-white">{value.toFixed(1)}</span>
                  </div>
                  <Progress value={value} className="h-2" />
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attestations received */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attestations</CardTitle>
        </CardHeader>
        <CardContent>
          {attestations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No attestations yet. As others recognize your contributions, they&apos;ll appear here.
            </p>
          ) : (
            <ul className="space-y-3" aria-label="Attestations received">
              {attestations.map((att) => (
                <li key={att.id} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-harbor-800 last:border-0">
                  <Avatar
                    name={att.from_user?.display_name || 'U'}
                    src={att.from_user?.avatar_url}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">
                        {att.from_user?.display_name}
                      </p>
                      <Badge variant="default" className="capitalize">{att.facet}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{att.reason}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(att.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
