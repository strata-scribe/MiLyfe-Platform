'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModuleList } from '@/components/learn/module-list';

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
}

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  duration_minutes: number;
  sort_order: number;
  requires_module_id: string | null;
  assessment_type: string;
}

interface Enrollment {
  id: string;
  status: string;
  progress_percent: number;
  current_module_id: string | null;
}

interface Progress {
  id: string;
  module_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number;
}

interface PathDetailViewProps {
  userId: string;
  path: LearnPath;
  modules: Module[];
  enrollment: Enrollment | null;
  progress: Progress[];
}

export function PathDetailView({
  userId,
  path,
  modules,
  enrollment,
  progress,
}: PathDetailViewProps) {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);

  const isEnrolled = enrollment !== null && enrollment.status !== 'dropped';
  const progressMap = new Map(progress.map((p) => [p.module_id, p]));
  const completedCount = progress.filter((p) => p.status === 'completed').length;

  async function handleEnroll() {
    setEnrolling(true);
    try {
      const res = await fetch('/api/learn/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path_id: path.id }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setEnrolling(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Back link */}
      <button
        onClick={() => router.push('/learn')}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Learn
      </button>

      {/* Path header */}
      <div className="rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-4xl"
            style={{ backgroundColor: `${path.color}20` }}
          >
            {path.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{path.title}</h1>
            <p className="mt-1 text-muted-foreground">{path.description}</p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>🕐 {path.duration_weeks}</span>
              <span>📚 {path.module_count} modules</span>
              <span>🤖 Helper: {path.helper_name}</span>
              <span>🏅 Badge: {path.completion_badge}</span>
            </div>
          </div>
        </div>

        {/* Enroll / Progress */}
        <div className="mt-4">
          {!isEnrolled ? (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {enrolling ? 'Enrolling...' : 'Start This Path'}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {completedCount} of {modules.length} modules completed
                </span>
                <span className="text-muted-foreground">
                  {enrollment.progress_percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${enrollment.progress_percent}%`,
                    backgroundColor: path.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Module list */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Modules</h2>
        <ModuleList
          modules={modules}
          progressMap={progressMap}
          isEnrolled={isEnrolled}
          pathSlug={path.slug}
          pathColor={path.color}
        />
      </div>
    </div>
  );
}
