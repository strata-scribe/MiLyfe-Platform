'use client';

import Link from 'next/link';

interface LearnPath {
  id: string;
  slug: string;
  title: string;
  icon: string;
  color: string;
  helper_name: string;
  module_count: number;
}

interface Enrollment {
  id: string;
  path_id: string;
  status: string;
  progress_percent: number;
  enrolled_at: string;
  completed_at: string | null;
}

interface JourneyProgressProps {
  enrollment: Enrollment;
  path: LearnPath;
}

export function JourneyProgress({ enrollment, path }: JourneyProgressProps) {
  const isComplete = enrollment.status === 'completed';
  const isPaused = enrollment.status === 'paused';

  return (
    <Link
      href={`/learn/${path.slug}`}
      className="block rounded-lg border p-4 transition-all hover:shadow-sm"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
          style={{ backgroundColor: `${path.color}20` }}
        >
          {path.icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-medium">{path.title}</h3>
            {isComplete && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Complete ✓
              </span>
            )}
            {isPaused && (
              <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                Paused
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${enrollment.progress_percent}%`,
                  backgroundColor: path.color,
                }}
              />
            </div>
            <span className="shrink-0 text-sm font-medium text-muted-foreground">
              {enrollment.progress_percent}%
            </span>
          </div>

          {/* Helper hint */}
          <p className="mt-1 text-xs text-muted-foreground">
            {isComplete
              ? `Completed — badge earned`
              : `${path.helper_name} is helping you with this path`}
          </p>
        </div>
      </div>
    </Link>
  );
}
