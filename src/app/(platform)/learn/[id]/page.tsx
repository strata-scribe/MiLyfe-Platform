'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  type: 'lesson' | 'quiz' | 'video';
  duration_minutes: number;
  order_num: number;
  content_md: string;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface Course {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  enrolled_count: number;
  created_at: string;
  profiles?: { display_name: string; avatar_url: string | null };
}

interface CourseProgress {
  course_id: string;
  user_id: string;
  completed_modules: string[];
  quiz_scores: Record<string, number>;
  completed: boolean;
  started_at: string;
}

interface Discussion {
  id: string;
  course_id: string;
  user_id: string;
  message: string;
  created_at: string;
  display_name?: string;
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const typeIcons: Record<string, string> = {
  lesson: '📖',
  quiz: '📝',
  video: '🎬',
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [discussionInput, setDiscussionInput] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadCourse(); }, [courseId]);

  async function loadCourse() {
    setLoading(true);
    const supabase = createClient();

    const { data: c } = await supabase
      .from('courses')
      .select('*, profiles!courses_creator_id_fkey(display_name, avatar_url)')
      .eq('id', courseId)
      .single();

    if (c) setCourse(c as any);

    // Fetch modules from course_modules table
    const { data: mods } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_num', { ascending: true });

    if (mods) setModules(mods as CourseModule[]);

    // Fetch progress if user logged in
    if (user) {
      const { data: p } = await supabase
        .from('course_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (p) {
        setProgress(p as CourseProgress);
        setEnrolled(true);
      }
    }

    // Fetch discussions
    const { data: d } = await supabase
      .from('course_discussions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (d) setDiscussions(d as Discussion[]);

    setLoading(false);
  }

  async function enroll() {
    if (!user || !course) return;
    const supabase = createClient();

    const { error } = await supabase.from('course_progress').insert({
      course_id: courseId,
      user_id: user.id,
      completed_modules: [],
      quiz_scores: {},
      completed: false,
      started_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to enroll');
      return;
    }

    await supabase.from('courses').update({ enrolled_count: (course.enrolled_count || 0) + 1 }).eq('id', courseId);
    setEnrolled(true);
    setProgress({
      course_id: courseId,
      user_id: user.id,
      completed_modules: [],
      quiz_scores: {},
      completed: false,
      started_at: new Date().toISOString(),
    });
    toast.success('Enrolled successfully!');
  }

  async function completeModule(moduleId: string) {
    if (!user || !progress) return;
    const supabase = createClient();

    const completedModules = Array.from(new Set([...progress.completed_modules, moduleId]));
    const isFullyCompleted = completedModules.length === modules.length;

    const { error } = await supabase.from('course_progress').update({
      completed_modules: completedModules,
      completed: isFullyCompleted,
    }).eq('course_id', courseId).eq('user_id', user.id);

    if (error) {
      toast.error('Failed to update progress');
      return;
    }

    setProgress({ ...progress, completed_modules: completedModules, completed: isFullyCompleted });

    // Award $MLY on course completion
    if (isFullyCompleted) {
      await supabase.rpc('increment_balance', { user_id: user.id, amount: 25 });
      toast.success('Course completed! +25 $MLY earned!');
    } else {
      toast.success('Module completed!');
      // Auto-advance to next module
      const currentIndex = modules.findIndex(m => m.id === moduleId);
      if (currentIndex < modules.length - 1) {
        setActiveModuleId(modules[currentIndex + 1].id);
        setQuizSubmitted(false);
        setQuizAnswers({});
        setQuizScore(null);
      }
    }
  }

  async function submitQuiz(module: CourseModule) {
    if (!user || !progress || !module.questions) return;

    const correct = module.questions.filter((q, i) => quizAnswers[`q${i}`] === q.correct).length;
    const score = Math.round((correct / module.questions.length) * 100);

    const supabase = createClient();
    const quizScores = { ...progress.quiz_scores, [module.id]: score };

    await supabase.from('course_progress').update({
      quiz_scores: quizScores,
    }).eq('course_id', courseId).eq('user_id', user.id);

    setProgress({ ...progress, quiz_scores: quizScores });
    setQuizSubmitted(true);
    setQuizScore(score);

    if (score >= 70) {
      toast.success(`Quiz passed! Score: ${score}%`);
    } else {
      toast.error(`Score: ${score}%. You need 70% to pass.`);
    }
  }

  async function postDiscussion() {
    if (!user || !discussionInput.trim()) return;
    const supabase = createClient();

    const { error } = await supabase.from('course_discussions').insert({
      course_id: courseId,
      user_id: user.id,
      message: discussionInput.trim(),
      display_name: user.display_name,
    });

    if (error) {
      toast.error('Failed to post');
      return;
    }

    setDiscussions(prev => [{
      id: Date.now().toString(),
      course_id: courseId,
      user_id: user.id,
      message: discussionInput.trim(),
      created_at: new Date().toISOString(),
      display_name: user.display_name,
    }, ...prev]);
    setDiscussionInput('');
    toast.success('Posted!');
  }

  function timeAgo(date: string) {
    const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-8 w-48" />
        <div className="card skeleton h-48" />
        <div className="card skeleton h-32" />
        <div className="card skeleton h-64" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4 animate-slide-up">
        <Link href="/learn" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Learn</Link>
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">📚</p>
          <p className="text-sm text-gray-500">Course not found</p>
        </div>
      </div>
    );
  }

  const completedCount = progress?.completed_modules.length || 0;
  const progressPct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
  const activeModule = modules.find(m => m.id === activeModuleId);

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <Link href="/learn" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Learn</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-2">{course.title}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', difficultyColors[course.difficulty] || 'bg-gray-100 text-gray-600')}>{course.difficulty}</span>
          <span className="text-xs text-gray-500 capitalize">{course.category}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{modules.length} modules</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">{course.enrolled_count || 0} enrolled</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{course.description}</p>
        <p className="text-xs text-gray-400 mt-1">By {(course.profiles as any)?.display_name}</p>
      </div>

      {/* Progress Bar */}
      {enrolled && (
        <div className="card">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500">{completedCount}/{modules.length} modules complete</span>
            <span className="text-teal-600 font-bold">{progressPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          {progress?.completed && (
            <p className="text-xs text-green-600 mt-2 font-medium">🎉 Course completed! +25 $MLY earned</p>
          )}
        </div>
      )}

      {/* Enroll / Start / Continue */}
      {!enrolled ? (
        <div className="card text-center py-6">
          <p className="text-sm font-medium text-harbor-800 dark:text-white">Ready to start learning?</p>
          <p className="text-xs text-gray-500 mt-1">Earn 25 $MLY when you complete all modules</p>
          <button onClick={enroll} className="btn-teal text-sm mt-4">Start Course</button>
        </div>
      ) : !activeModuleId && modules.length > 0 && (
        <button
          onClick={() => {
            const nextIncomplete = modules.find(m => !progress?.completed_modules.includes(m.id));
            setActiveModuleId(nextIncomplete?.id || modules[0].id);
          }}
          className="btn-teal w-full"
        >
          {completedCount > 0 ? 'Continue Learning' : 'Start First Module'}
        </button>
      )}

      {/* Module List */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Modules</h3>
        {modules.map((mod, idx) => {
          const isCompleted = progress?.completed_modules.includes(mod.id);
          const isActive = activeModuleId === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => {
                if (enrolled) {
                  setActiveModuleId(mod.id);
                  setQuizSubmitted(false);
                  setQuizAnswers({});
                  setQuizScore(null);
                }
              }}
              className={cn(
                'card w-full text-left flex items-center gap-3 transition-all',
                isActive && 'ring-2 ring-teal-500 shadow-md',
                !enrolled && 'opacity-60 cursor-default'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0',
                isCompleted
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                  : isActive
                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
                    : 'bg-gray-100 dark:bg-harbor-800 text-gray-500'
              )}>
                {isCompleted ? '✓' : typeIcons[mod.type] || `${idx + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">{mod.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="capitalize">{mod.type}</span>
                  <span>·</span>
                  <span>{mod.duration_minutes} min</span>
                  {isCompleted && <span className="text-green-600 font-medium">Completed</span>}
                </div>
              </div>
              {progress?.quiz_scores[mod.id] !== undefined && (
                <span className="text-xs text-mly-600 font-bold">{progress.quiz_scores[mod.id]}%</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Module Content */}
      {activeModule && enrolled && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-harbor-800 dark:text-white">{activeModule.title}</h2>
            <span className="text-xs text-gray-400">{typeIcons[activeModule.type]} {activeModule.type} · {activeModule.duration_minutes} min</span>
          </div>

          {/* Markdown content */}
          <div className="prose prose-sm dark:prose-invert text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-w-none">
            <ReactMarkdown>{activeModule.content_md}</ReactMarkdown>
          </div>

          {/* Quiz Section */}
          {activeModule.type === 'quiz' && activeModule.questions && activeModule.questions.length > 0 && (
            <div className="border-t border-gray-100 dark:border-harbor-800 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-harbor-800 dark:text-white">📝 Quiz</h3>
              {activeModule.questions.map((q, qi) => (
                <div key={qi} className="space-y-2">
                  <p className="text-sm font-medium text-harbor-800 dark:text-white">{qi + 1}. {q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <button
                        key={oi}
                        onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [`q${qi}`]: oi })}
                        disabled={quizSubmitted}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-xs transition-all border',
                          quizSubmitted && oi === q.correct
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300'
                            : quizSubmitted && quizAnswers[`q${qi}`] === oi && oi !== q.correct
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300'
                              : quizAnswers[`q${qi}`] === oi
                                ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border-teal-300'
                                : 'bg-gray-50 dark:bg-harbor-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-harbor-700 hover:border-teal-300'
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {!quizSubmitted ? (
                <button
                  onClick={() => submitQuiz(activeModule)}
                  disabled={Object.keys(quizAnswers).length < (activeModule.questions?.length || 0)}
                  className="btn-teal w-full disabled:opacity-50"
                >
                  Submit Answers
                </button>
              ) : (
                <div className="text-center py-2">
                  <p className={cn('text-sm font-bold', (quizScore || 0) >= 70 ? 'text-green-600' : 'text-red-600')}>
                    Score: {quizScore}%
                  </p>
                  {(quizScore || 0) < 70 && (
                    <button
                      onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setQuizScore(null); }}
                      className="text-xs text-teal-600 mt-1 hover:underline"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Complete Module Button */}
          {!progress?.completed_modules.includes(activeModule.id) && (
            <button
              onClick={() => completeModule(activeModule.id)}
              disabled={activeModule.type === 'quiz' && !quizSubmitted}
              className="btn-teal w-full disabled:opacity-50"
            >
              {activeModule.type === 'quiz' ? 'Complete Quiz & Continue →' : 'Mark Complete & Continue →'}
            </button>
          )}
        </div>
      )}

      {/* Discussion Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Discussion ({discussions.length})</h3>

        {user && (
          <div className="card space-y-2">
            <textarea
              value={discussionInput}
              onChange={e => setDiscussionInput(e.target.value)}
              placeholder="Ask a question or share a thought..."
              className="input-field resize-none text-sm"
              rows={3}
            />
            <div className="flex justify-end">
              <button onClick={postDiscussion} disabled={!discussionInput.trim()} className="btn-teal text-xs disabled:opacity-50">Post</button>
            </div>
          </div>
        )}

        {discussions.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-xs text-gray-500">No discussion yet. Be the first to ask!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {discussions.map(d => (
              <div key={d.id} className="card py-2.5">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="font-medium text-teal-600">{d.display_name}</span>
                  <span>·</span>
                  <span>{timeAgo(d.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{d.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
