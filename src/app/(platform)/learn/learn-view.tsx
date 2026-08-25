'use client';

import { useState } from 'react';
import { PathCard } from '@/components/learn/path-card';
import { JourneyProgress } from '@/components/learn/journey-progress';
import { BadgeGrid } from '@/components/learn/badge-grid';

interface LearnPath {
  id: string;
  slug: string;
  title: string;
  description: string;
  helper_name: string;
  icon: string;
  color: string;
  target_audience: string;
  duration_weeks: string;
  completion_badge: string;
  module_count: number;
  enrolled_count: number;
}

interface Enrollment {
  id: string;
  path_id: string;
  status: string;
  progress_percent: number;
  enrolled_at: string;
  completed_at: string | null;
  learn_paths: LearnPath;
}

interface Badge {
  id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
  path_id: string;
}

interface LearnViewProps {
  userId: string;
  paths: LearnPath[];
  enrollments: Enrollment[];
  badges: Badge[];
}

type Tab = 'journey' | 'paths' | 'badges';

export function LearnView({ userId, paths, enrollments, badges }: LearnViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>(
    enrollments.length > 0 ? 'journey' : 'paths',
  );

  const enrolledPathIds = new Set(enrollments.map((e) => e.path_id));
  const unenrolledPaths = paths.filter((p) => !enrolledPathIds.has(p.id));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Learn</h1>
        <p className="text-muted-foreground">
          Your education journey. Always free. Always offline-capable. Badges leave with you.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <TabButton active={activeTab === 'journey'} onClick={() => setActiveTab('journey')}>
          My Journey {enrollments.length > 0 && `(${enrollments.length})`}
        </TabButton>
        <TabButton active={activeTab === 'paths'} onClick={() => setActiveTab('paths')}>
          All Paths ({paths.length})
        </TabButton>
        <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')}>
          Badges {badges.length > 0 && `(${badges.length})`}
        </TabButton>
      </div>

      {/* Content */}
      {activeTab === 'journey' && (
        <div className="space-y-6">
          {enrollments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-lg font-medium">Start your journey</p>
              <p className="text-muted-foreground mt-1">
                Choose a path below to begin learning. No pressure — go at your own pace.
              </p>
              <button
                onClick={() => setActiveTab('paths')}
                className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Browse Paths
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <JourneyProgress
                  key={enrollment.id}
                  enrollment={enrollment}
                  path={enrollment.learn_paths}
                />
              ))}
            </div>
          )}

          {/* Suggested next paths */}
          {unenrolledPaths.length > 0 && enrollments.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Continue growing</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {unenrolledPaths.slice(0, 4).map((path) => (
                  <PathCard key={path.id} path={path} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'paths' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              enrolled={enrolledPathIds.has(path.id)}
            />
          ))}
        </div>
      )}

      {activeTab === 'badges' && <BadgeGrid badges={badges} />}
    </div>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
