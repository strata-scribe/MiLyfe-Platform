'use client';

import Link from 'next/link';

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

interface PathCardProps {
  path: LearnPath;
  enrolled?: boolean;
  compact?: boolean;
}

export function PathCard({ path, enrolled, compact }: PathCardProps) {
  if (compact) {
    return (
      <Link
        href={`/learn/${path.slug}`}
        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
      >
        <span className="text-2xl">{path.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{path.title}</p>
          <p className="truncate text-sm text-muted-foreground">
            {path.duration_weeks} · {path.module_count} modules
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/learn/${path.slug}`}
      className="group relative overflow-hidden rounded-lg border transition-all hover:shadow-md"
    >
      {/* Color accent bar */}
      <div className="h-1.5" style={{ backgroundColor: path.color }} />

      <div className="p-4">
        {/* Icon + enrolled badge */}
        <div className="mb-3 flex items-start justify-between">
          <span className="text-3xl">{path.icon}</span>
          {enrolled && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Enrolled
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-1 font-semibold group-hover:text-primary">{path.title}</h3>

        {/* Description */}
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
          {path.description}
        </p>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            🕐 {path.duration_weeks}
          </span>
          <span className="flex items-center gap-1">
            📚 {path.module_count} modules
          </span>
          <span className="flex items-center gap-1">
            🤖 {path.helper_name}
          </span>
        </div>

        {/* Audience */}
        <p className="mt-2 text-xs text-muted-foreground/70">
          For: {path.target_audience}
        </p>
      </div>
    </Link>
  );
}
