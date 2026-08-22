'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

interface Module {
  id: string;
  title: string;
  content: string;
  quiz?: { question: string; options: string[]; correct: number }[];
}

interface Course {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  modules: Module[];
  mly_reward: number;
  enrolled_count: number;
  created_at: string;
  profiles?: { display_name: string };
}

interface Progress {
  course_id: string;
  user_id: string;
  completed_modules: string[];
  quiz_scores: Record<string, number>;
  completed: boolean;
  started_at: string;
}

interface Discussion {
  id: string;
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

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [discussionInput, setDiscussionInput] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  const { user } = useAppStore();

  useEffect(() => { loadCourse(); }, [courseId]);

  async function loadCourse() {
    setLoading(true);
    const supabase = createClient();

    const { data: c } = await supabase
      .from('courses')
      .select('*, profiles!courses_creator_id_fkey(display_name)')
      .eq('id', courseId)
      .single();
    if (c) setCourse(c as any);

    if (user) {
      const { data: p } = await supabase
        .from('course_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();
      if (p) {
        setProgress(p);
        setEnrolled(true);
      }
    }

    const { data: d } = await supabase
      .from('course_discussions')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (d) setDiscussions(d);

    setLoading(false);
  }

  async function enroll() {
    if (!user || !course) return;
    const supabase = createClient();
    await supabase.from('course_progress').insert({
      course_id: courseId, user_id: user.id,
      completed_modules: [], quiz_scores: {}, completed: false,
      started_at: new Date().toISOString(),
    });
    await supabase.from('courses').update({ enrolled_count: course.enrolled_count + 1 }).eq('id', courseId);
    setEnrolled(true);
    setProgress({ course_id: courseId, user_id: user.id, completed_modules: [], quiz_scores: {}, completed: false, started_at: new Date().toISOString() });
  }

  async function completeModule() {
    if (!user || !course || !progress) return;
    const module = course.modules[activeModule];
    if (!module) return;

    const supabase = createClient();
    const completedModules = [...progress.completed_modules, module.id];
    const isFullyCompleted = completedModules.length === course.modules.length;

    await supabase.from('course_progress').update({
      completed_modules: completedModules,
      completed: isFullyCompleted,
    }).eq('course_id', courseId).eq('user_id', user.id);

    setProgress({ ...progress, completed_modules: completedModules, completed: isFullyCompleted });

    // Award MLY if completed
    if (isFullyCompleted && course.mly_reward > 0) {
      await supabase.rpc('add_mly', { user_id: user.id, amount: course.mly_reward });
    }

    // Move to next module
    if (activeModule < course.modules.length - 1) {
      setActiveModule(activeModule + 1);
      setQuizSubmitted(false);
      setQuizAnswers({});
    }
  }

  async function submitQuiz() {
    if (!user || !course || !progress) return;
    const module = course.modules[activeModule];
    if (!module?.quiz) return;

    const correct = module.quiz.filter((q, i) => quizAnswers[`q${i}`] === q.correct).length;
    const score = Math.round((correct / module.quiz.length) * 100);

    const supabase = createClient();
    const quizScores = { ...progress.quiz_scores, [module.id]: score };
    await supabase.from('course_progress').update({ quiz_scores: quizScores }).eq('course_id', courseId).eq('user_id', user.id);
    setProgress({ ...progress, quiz_scores: quizScores });
    setQuizSubmitted(true);
  }

  async function postDiscussion() {
    if (!user || !discussionInput.trim()) return;
    const supabase = createClient();
    await supabase.from('course_discussions').insert({
      course_id: courseId, user_id: user.id,
      message: discussionInput.trim(), display_name: user.display_name,
    });
    setDiscussions(prev => [{ id: Date.now().toString(), user_id: user.id, message: discussionInput.trim(), created_at: new Date().toISOString(), display_name: user.display_name }, ...prev]);
    setDiscussionInput('');
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-slide-up">
        <div className="card skeleton h-8 w-48" />
        <div className="card skeleton h-48" />
        <div className="card skeleton h-32" />
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

  const currentModule = course.modules[activeModule];
  const completedCount = progress?.completed_modules.length || 0;
  const progressPct = course.modules.length > 0 ? Math.round((completedCount / course.modules.length) * 100) : 0;
  const isModuleCompleted = progress?.completed_modules.includes(currentModule?.id || '');

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Header */}
      <div>
        <Link href="/learn" className="text-gray-400 hover:text-gray-600 text-sm">← Back to Learn</Link>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white mt-1">{course.title}</h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded capitalize', difficultyColors[course.difficulty] || '')}>{course.difficulty}</span>
          <span className="text-xs text-gray-500">{course.category}</span>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-500">{course.modules.length} modules</span>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-500">{course.enrolled_count} enrolled</span>
          <span className="text-xs text-mly-600 font-bold ml-auto">+{course.mly_reward} MLY</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">{course.description}</p>
        <p className="text-xs text-gray-400 mt-1">By {(course.profiles as any)?.display_name}</p>
      </div>

      {/* Enrollment / Progress */}
      {!enrolled ? (
        <div className="card text-center py-6">
          <p className="text-sm text-harbor-800 dark:text-white font-medium">Ready to learn?</p>
          <p className="text-xs text-gray-500 mt-1">Earn {course.mly_reward} $MLY when you complete all modules</p>
          <button onClick={enroll} className="btn-teal text-sm mt-4">Enroll Now</button>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="card">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-gray-500">{completedCount}/{course.modules.length} modules complete</span>
              <span className="text-teal-600 font-bold">{progressPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-harbor-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            {progress?.completed && (
              <p className="text-xs text-green-600 mt-2 font-medium">🎉 Course completed! +{course.mly_reward} MLY earned</p>
            )}
          </div>

          {/* Module Navigation */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {course.modules.map((mod, i) => {
              const completed = progress?.completed_modules.includes(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => { setActiveModule(i); setQuizSubmitted(false); setQuizAnswers({}); }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex-shrink-0 transition-all',
                    i === activeModule
                      ? 'bg-teal-500 text-white'
                      : completed
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-harbor-800 text-gray-600'
                  )}
                >
                  {completed ? '✓ ' : ''}{i + 1}. {mod.title.substring(0, 15)}{mod.title.length > 15 ? '...' : ''}
                </button>
              );
            })}
          </div>

          {/* Module Content */}
          {currentModule && (
            <div className="card space-y-4">
              <h2 className="text-sm font-bold text-harbor-800 dark:text-white">{currentModule.title}</h2>
              <div className="prose prose-sm dark:prose-invert text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {currentModule.content}
              </div>

              {/* Quiz */}
              {currentModule.quiz && currentModule.quiz.length > 0 && (
                <div className="border-t border-gray-100 dark:border-harbor-800 pt-4 space-y-4">
                  <h3 className="text-sm font-bold text-harbor-800 dark:text-white">📝 Quiz</h3>
                  {currentModule.quiz.map((q, qi) => (
                    <div key={qi} className="space-y-2">
                      <p className="text-sm text-harbor-800 dark:text-white">{qi + 1}. {q.question}</p>
                      <div className="space-y-1">
                        {q.options.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [`q${qi}`]: oi })}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-lg text-xs transition-all',
                              quizSubmitted && oi === q.correct
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300'
                                : quizSubmitted && quizAnswers[`q${qi}`] === oi && oi !== q.correct
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-300'
                                  : quizAnswers[`q${qi}`] === oi
                                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400 border border-teal-300'
                                    : 'bg-gray-50 dark:bg-harbor-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-harbor-700 hover:border-teal-300'
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!quizSubmitted ? (
                    <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length < (currentModule.quiz?.length || 0)} className="btn-teal w-full disabled:opacity-50">Submit Answers</button>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-harbor-800 dark:text-white">
                        Score: {progress?.quiz_scores[currentModule.id] || 0}%
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Complete module button */}
              {!isModuleCompleted && (
                <button onClick={completeModule} className="btn-teal w-full">
                  {currentModule.quiz ? 'Complete Module & Continue →' : 'Mark Complete & Continue →'}
                </button>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={() => setShowNotes(!showNotes)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all', showNotes ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>📝 Notes</button>
            <button onClick={() => setShowDiscussion(!showDiscussion)} className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all', showDiscussion ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600')}>💬 Discussion ({discussions.length})</button>
          </div>

          {/* Notes */}
          {showNotes && (
            <div className="card">
              <h3 className="text-xs font-bold text-harbor-800 dark:text-white mb-2">My Notes</h3>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Take notes here..." className="input-field resize-none text-xs" rows={4} />
            </div>
          )}

          {/* Discussion */}
          {showDiscussion && (
            <div className="card space-y-3">
              <h3 className="text-xs font-bold text-harbor-800 dark:text-white">Discussion</h3>
              {user && (
                <div className="flex gap-2">
                  <input value={discussionInput} onChange={e => setDiscussionInput(e.target.value)} placeholder="Ask a question or comment..." className="input-field flex-1 text-xs" onKeyDown={e => e.key === 'Enter' && postDiscussion()} />
                  <button onClick={postDiscussion} disabled={!discussionInput.trim()} className="btn-teal text-xs disabled:opacity-50">Post</button>
                </div>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {discussions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No discussion yet</p>
                ) : discussions.map(d => (
                  <div key={d.id} className="bg-gray-50 dark:bg-harbor-900 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-teal-600">{d.display_name}</span>
                      <span className="text-[10px] text-gray-400">{new Date(d.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{d.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
