'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startModule, completeModule } from '@/lib/actions/learn';
import { AssessmentQuiz } from '@/components/learn/assessment-quiz';
import { AssessmentReflection } from '@/components/learn/assessment-reflection';

interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  content_markdown: string;
  duration_minutes: number;
  sort_order: number;
  assessment_type: string;
}

interface Progress {
  id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  time_spent_minutes: number;
}

interface Path {
  id: string;
  slug: string;
  title: string;
  color: string;
  helper_name: string;
}

interface NavModule {
  id: string;
  slug: string;
  title: string;
  sort_order: number;
}

interface ModuleContentViewProps {
  userId: string;
  path: Path;
  module: Module;
  progress: Progress | null;
  allModules: NavModule[];
}

export function ModuleContentView({ userId, path, module: mod, progress, allModules }: ModuleContentViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(progress?.status || 'not_started');
  const [showAssessment, setShowAssessment] = useState(false);
  const startTimeRef = useRef(Date.now());

  const currentIndex = allModules.findIndex(m => m.id === mod.id);
  const prevModule = currentIndex > 0 ? allModules[currentIndex - 1] : null;
  const nextModule = currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null;

  // Auto-start module when visiting
  useEffect(() => {
    if (status === 'not_started') {
      startTransition(async () => {
        await startModule(mod.id);
        setStatus('in_progress');
      });
    }
  }, [mod.id, status]);

  function handleComplete() {
    const minutesSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));

    if (mod.assessment_type !== 'completion') {
      setShowAssessment(true);
      return;
    }

    startTransition(async () => {
      await completeModule({ module_id: mod.id, time_spent_minutes: minutesSpent });
      setStatus('completed');
      router.refresh();
    });
  }

  function handleAssessmentDone() {
    const minutesSpent = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
    startTransition(async () => {
      await completeModule({ module_id: mod.id, time_spent_minutes: minutesSpent });
      setStatus('completed');
      setShowAssessment(false);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.push('/learn')} className="hover:text-foreground">Learn</button>
        <span>/</span>
        <button onClick={() => router.push(`/learn/${path.slug}`)} className="hover:text-foreground">{path.title}</button>
        <span>/</span>
        <span className="text-foreground font-medium">{mod.title}</span>
      </div>

      {/* Module header */}
      <div className="rounded-lg border p-5" style={{ borderTopColor: path.color, borderTopWidth: '3px' }}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="capitalize">{mod.type}</span>
          <span>·</span>
          <span>{mod.duration_minutes} min</span>
          <span>·</span>
          <span>Module {mod.sort_order} of {allModules.length}</span>
          {status === 'completed' && (
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Complete ✓
            </span>
          )}
          {status === 'in_progress' && (
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              In Progress
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold">{mod.title}</h1>
        <p className="mt-1 text-muted-foreground">{mod.description}</p>
      </div>

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-6">
        {mod.content_markdown ? (
          <div dangerouslySetInnerHTML={{ __html: markdownToHtml(mod.content_markdown) }} />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-2xl mb-2">📝</p>
            <p>Content for this module is being developed.</p>
            <p className="text-sm mt-1">Helper <strong>{path.helper_name}</strong> will guide you through this topic.</p>
          </div>
        )}
      </div>

      {/* Assessment section */}
      {showAssessment && (
        <div className="rounded-lg border-2 border-primary/30 p-6">
          <h2 className="text-lg font-semibold mb-4">Assessment: {mod.assessment_type}</h2>
          {mod.assessment_type === 'quiz' && (
            <AssessmentQuiz moduleId={mod.id} onComplete={handleAssessmentDone} />
          )}
          {(mod.assessment_type === 'reflection' || mod.assessment_type === 'portfolio') && (
            <AssessmentReflection
              moduleId={mod.id}
              type={mod.assessment_type}
              onComplete={handleAssessmentDone}
            />
          )}
          {mod.assessment_type === 'project' && (
            <AssessmentReflection
              moduleId={mod.id}
              type="project"
              onComplete={handleAssessmentDone}
            />
          )}
        </div>
      )}

      {/* Actions */}
      {status !== 'completed' && !showAssessment && (
        <div className="flex justify-center">
          <button
            onClick={handleComplete}
            disabled={isPending}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Saving...' : mod.assessment_type === 'completion' ? 'Mark Complete ✓' : 'Continue to Assessment →'}
          </button>
        </div>
      )}

      {status === 'completed' && !showAssessment && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
          <p className="text-green-800 font-medium">Module completed! 🎉</p>
          <p className="text-green-700 text-sm mt-1">Your progress has been saved.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        {prevModule ? (
          <button
            onClick={() => router.push(`/learn/${path.slug}/${prevModule.slug}`)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {prevModule.title}
          </button>
        ) : <div />}

        {nextModule ? (
          <button
            onClick={() => router.push(`/learn/${path.slug}/${nextModule.slug}`)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {nextModule.title} →
          </button>
        ) : (
          <button
            onClick={() => router.push(`/learn/${path.slug}`)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Path Overview
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Simple markdown-to-HTML converter for module content.
 * In production, use a proper MDX renderer or remark/rehype pipeline.
 */
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return `<p>${match}</p>`;
    });
}
