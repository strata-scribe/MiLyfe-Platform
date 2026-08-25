'use client';

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

interface Progress {
  id: string;
  module_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number;
}

interface ModuleListProps {
  modules: Module[];
  progressMap: Map<string, Progress>;
  isEnrolled: boolean;
  pathSlug: string;
  pathColor: string;
}

const TYPE_ICONS: Record<string, string> = {
  lesson: '📖',
  exercise: '✏️',
  practice: '🎯',
  assessment: '📝',
  project: '🏗️',
  reflection: '💭',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  submitted: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Submitted' },
  skipped: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Skipped' },
};

export function ModuleList({
  modules,
  progressMap,
  isEnrolled,
  pathSlug,
  pathColor,
}: ModuleListProps) {
  return (
    <div className="space-y-2">
      {modules.map((module, index) => {
        const progress = progressMap.get(module.id);
        const status = progress?.status || 'not_started';
        const statusStyle = STATUS_STYLES[status];
        const isLocked = !isEnrolled;

        const content = (
          <div
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
              isLocked ? 'opacity-60' : 'hover:bg-muted/50 cursor-pointer'
            }`}
          >
            {/* Step number / status indicator */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                status === 'completed'
                  ? 'bg-green-500 text-white'
                  : status === 'in_progress'
                    ? 'border-2 text-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
              style={
                status === 'in_progress' ? { borderColor: pathColor } : undefined
              }
            >
              {status === 'completed' ? '✓' : index + 1}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span>{TYPE_ICONS[module.type] || '📄'}</span>
                <h4 className="truncate font-medium">{module.title}</h4>
                {statusStyle && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {statusStyle.label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {module.description}
              </p>
            </div>

            {/* Duration */}
            <span className="shrink-0 text-xs text-muted-foreground">
              {module.duration_minutes}min
            </span>
          </div>
        );

        if (isLocked) return <div key={module.id}>{content}</div>;

        return (
          <a key={module.id} href={`/learn/${pathSlug}/${module.slug}`}>
            {content}
          </a>
        );
      })}
    </div>
  );
}
