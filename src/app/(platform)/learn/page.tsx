'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { cn } from '@/lib/utils/cn';

type LearnView = 'browse' | 'course' | 'my';

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

interface Module {
  id: string;
  title: string;
  content: string;
  quiz?: { question: string; options: string[]; correct: number }[];
}

interface Progress {
  course_id: string;
  completed_modules: string[];
  quiz_scores: Record<string, number>;
  completed: boolean;
}

const categories = ['All', 'Legal & Rights', 'Financial', 'Health', 'Digital', 'Civic', 'Career', 'Life Skills'];
const difficultyColors: Record<string, string> = { beginner: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700' };

export default function LearnPage() {
  const [view, setView] = useState<LearnView>('browse');
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('All');

  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*, profiles!courses_creator_id_fkey(display_name)')
        .eq('published', true)
        .order('enrolled_count', { ascending: false });
      if (data) setCourses(data);

      if (user) {
        const { data: prog } = await supabase
          .from('course_progress')
          .select('*')
          .eq('user_id', user.id);
        if (prog) setProgress(prog);
      }
      setLoading(false);
    };
    load();
  }, [user, supabase]);

  const startCourse = async (course: Course) => {
    setActiveCourse(course);
    setActiveModule(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setView('course');

    // Create or update progress
    if (user) {
      const existing = progress.find(p => p.course_id === course.id);
      if (!existing) {
        await supabase.from('course_progress').insert({ user_id: user.id, course_id: course.id });
        await supabase.from('courses').update({ enrolled_count: course.enrolled_count + 1 }).eq('id', course.id);
      }
    }
  };

  const completeModule = async () => {
    if (!activeCourse || !user) return;
    const moduleId = activeCourse.modules[activeModule].id;
    const existing = progress.find(p => p.course_id === activeCourse.id);
    const completed = [...(existing?.completed_modules || []), moduleId];

    await supabase.from('course_progress').update({ completed_modules: completed }).eq('user_id', user.id).eq('course_id', activeCourse.id);

    // Check if all modules done
    if (completed.length >= activeCourse.modules.length) {
      await supabase.from('course_progress').update({ completed: true, completed_at: new Date().toISOString() }).eq('user_id', user.id).eq('course_id', activeCourse.id);
      // Award MLY
      await supabase.from('mly_transactions').insert({ to_id: user.id, amount: activeCourse.mly_reward, type: 'earn', description: `Completed course: ${activeCourse.title}` });
      await supabase.rpc('increment_balance', { user_id: user.id, amount: activeCourse.mly_reward });
    }

    setProgress(prev => {
      const idx = prev.findIndex(p => p.course_id === activeCourse.id);
      if (idx >= 0) { prev[idx] = { ...prev[idx], completed_modules: completed, completed: completed.length >= activeCourse.modules.length }; return [...prev]; }
      return [...prev, { course_id: activeCourse.id, completed_modules: completed, quiz_scores: {}, completed: completed.length >= activeCourse.modules.length }];
    });

    if (activeModule < activeCourse.modules.length - 1) {
      setActiveModule(activeModule + 1);
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  const handleQuizSubmit = () => setQuizSubmitted(true);

  const getProgress = (courseId: string) => {
    const p = progress.find(pr => pr.course_id === courseId);
    if (!p) return 0;
    const course = courses.find(c => c.id === courseId);
    if (!course || course.modules.length === 0) return 0;
    return Math.round((p.completed_modules.length / course.modules.length) * 100);
  };

  const filtered = catFilter === 'All' ? courses : courses.filter(c => c.category === catFilter);
  const myCourses = courses.filter(c => progress.some(p => p.course_id === c.id));

  // Course View
  if (view === 'course' && activeCourse) {
    const mod = activeCourse.modules[activeModule];
    const isComplete = progress.find(p => p.course_id === activeCourse.id)?.completed_modules.includes(mod.id);

    return (
      <div className="space-y-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('browse')} className="text-teal-500 text-sm">← Back</button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 truncate">{activeCourse.title}</p>
            <p className="text-sm font-bold text-harbor-800 dark:text-white">Module {activeModule + 1}/{activeCourse.modules.length}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-harbor-800 rounded-full h-2">
          <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${((activeModule + 1) / activeCourse.modules.length) * 100}%` }} />
        </div>

        {/* Module Content */}
        <div className="card space-y-4">
          <h2 className="text-base font-bold text-harbor-800 dark:text-white">{mod.title}</h2>
          <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
            {mod.content}
          </div>
        </div>

        {/* Quiz */}
        {mod.quiz && mod.quiz.length > 0 && (
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-harbor-800 dark:text-white">Quick Check</h3>
            {mod.quiz.map((q, qi) => (
              <div key={qi} className="space-y-2">
                <p className="text-sm text-harbor-800 dark:text-white">{q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => !quizSubmitted && setQuizAnswers({ ...quizAnswers, [qi]: oi })}
                      disabled={quizSubmitted}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm border-2 transition-all',
                        quizSubmitted && oi === q.correct ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' :
                        quizSubmitted && quizAnswers[qi] === oi && oi !== q.correct ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                        quizAnswers[qi] === oi ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' :
                        'border-gray-200 dark:border-harbor-700'
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!quizSubmitted ? (
              <button onClick={handleQuizSubmit} disabled={Object.keys(quizAnswers).length < mod.quiz.length} className="btn-teal w-full text-sm disabled:opacity-50">Check Answers</button>
            ) : (
              <p className="text-sm text-teal-500 font-medium text-center">
                {Object.entries(quizAnswers).filter(([qi, a]) => mod.quiz![parseInt(qi)].correct === a).length}/{mod.quiz.length} correct
              </p>
            )}
          </div>
        )}

        {/* Bookmark + Notes + Discussion */}
        <div className="flex gap-2">
          <BookmarkButton courseId={activeCourse.id} moduleId={mod.id} />
          <button onClick={() => setShowNotes(!showNotes)} className={cn('flex-1 py-2 rounded-xl text-xs font-medium border transition-colors', showNotes ? 'bg-mly-50 dark:bg-mly-900/20 border-mly-300 dark:border-mly-700 text-mly-600' : 'bg-gray-100 dark:bg-harbor-800 border-transparent text-gray-600 dark:text-gray-300')}>
            📝 My Notes
          </button>
          <button onClick={() => setShowDiscussion(!showDiscussion)} className={cn('flex-1 py-2 rounded-xl text-xs font-medium border transition-colors', showDiscussion ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-600' : 'bg-gray-100 dark:bg-harbor-800 border-transparent text-gray-600 dark:text-gray-300')}>
            💬 Discussion
          </button>
        </div>

        {showNotes && <NotesPanel courseId={activeCourse.id} moduleId={mod.id} />}
        {showDiscussion && <DiscussionPanel courseId={activeCourse.id} moduleId={mod.id} />}

        {/* Next/Complete Button */}
        <button onClick={completeModule} className={cn('w-full py-3 rounded-xl font-medium text-sm', isComplete ? 'btn-primary' : 'btn-teal')}>
          {activeModule < activeCourse.modules.length - 1
            ? (isComplete ? 'Next Module →' : `Complete & Continue (+$${activeCourse.mly_reward} on finish)`)
            : (isComplete ? 'Already Completed ✓' : `Finish Course (+$${activeCourse.mly_reward} MLY)`)}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-slide-up">
      <div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">MiLearn</h1>
        <p className="text-xs text-gray-500">Know your rights. Build skills. Earn $MLY.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-harbor-900 rounded-xl p-1">
        <button onClick={() => setView('browse')} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all', view === 'browse' ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>All Courses</button>
        <button onClick={() => setView('my')} className={cn('flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all', view === 'my' ? 'bg-white dark:bg-harbor-800 text-harbor-800 dark:text-white shadow-sm' : 'text-gray-500')}>My Learning</button>
        <a href="/learn/create" className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-center text-teal-500">+ Create</a>
      </div>

      {view === 'browse' && (
        <>
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all', catFilter === cat ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
                {cat}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="space-y-3">
            {loading ? [1,2,3].map(i => <div key={i} className="card skeleton h-24" />) :
            filtered.length === 0 ? (
              <div className="text-center py-12"><p className="text-4xl mb-2">📚</p><p className="text-gray-500">No courses in this category yet.</p></div>
            ) : filtered.map(course => {
              const prog = getProgress(course.id);
              return (
                <button key={course.id} onClick={() => startCourse(course)} className="card w-full text-left hover:scale-[1.01] transition-transform space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-harbor-800 dark:text-white">{course.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{course.description}</p>
                    </div>
                    <span className="text-xs font-bold text-mly-600 bg-mly-50 dark:bg-mly-900/20 px-2 py-0.5 rounded-full ml-2">+${course.mly_reward}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full capitalize', difficultyColors[course.difficulty])}>{course.difficulty}</span>
                    <span className="text-[10px] text-gray-400">{course.modules.length} modules</span>
                    <span className="text-[10px] text-gray-400">{course.enrolled_count} enrolled</span>
                    {prog > 0 && (
                      <span className="text-[10px] text-teal-500 font-medium">{prog}% done</span>
                    )}
                  </div>
                  {prog > 0 && prog < 100 && (
                    <div className="w-full bg-gray-200 dark:bg-harbor-800 rounded-full h-1.5">
                      <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${prog}%` }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {view === 'my' && (
        <div className="space-y-3">
          {myCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📖</p>
              <p className="text-gray-500">No courses started yet.</p>
              <button onClick={() => setView('browse')} className="btn-teal mt-3 text-sm">Browse Courses</button>
            </div>
          ) : myCourses.map(course => {
            const prog = getProgress(course.id);
            const isComplete = progress.find(p => p.course_id === course.id)?.completed;
            return (
              <button key={course.id} onClick={() => startCourse(course)} className="card w-full text-left space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isComplete ? '✅' : '📖'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-harbor-800 dark:text-white">{course.title}</p>
                    <p className="text-xs text-gray-500">{isComplete ? 'Completed' : `${prog}% done`}</p>
                  </div>
                  {isComplete && <span className="text-xs text-teal-500 font-bold">+${course.mly_reward}</span>}
                </div>
                {!isComplete && (
                  <div className="w-full bg-gray-200 dark:bg-harbor-800 rounded-full h-1.5">
                    <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${prog}%` }} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Bookmark button component
function BookmarkButton({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase.from('course_bookmarks').select('module_id').eq('user_id', user.id).eq('course_id', courseId).eq('module_id', moduleId).maybeSingle().then(({ data }) => setBookmarked(!!data));
  }, [user, courseId, moduleId, supabase]);

  const toggle = async () => {
    if (!user) return;
    if (bookmarked) {
      await supabase.from('course_bookmarks').delete().eq('user_id', user.id).eq('course_id', courseId).eq('module_id', moduleId);
    } else {
      await supabase.from('course_bookmarks').insert({ user_id: user.id, course_id: courseId, module_id: moduleId });
    }
    setBookmarked(!bookmarked);
  };

  return (
    <button onClick={toggle} className={cn('py-2 px-4 rounded-xl text-xs font-medium border transition-colors', bookmarked ? 'bg-mly-50 dark:bg-mly-900/20 border-mly-300 text-mly-600' : 'bg-gray-100 dark:bg-harbor-800 border-transparent text-gray-600 dark:text-gray-300')}>
      {bookmarked ? '🔖 Saved' : '🏷️ Save'}
    </button>
  );
}

// Notes panel
function NotesPanel({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase.from('course_notes').select('content').eq('user_id', user.id).eq('course_id', courseId).eq('module_id', moduleId).maybeSingle().then(({ data }) => { if (data) setNote(data.content); });
  }, [user, courseId, moduleId, supabase]);

  const save = async () => {
    if (!user) return;
    const { data: existing } = await supabase.from('course_notes').select('id').eq('user_id', user.id).eq('course_id', courseId).eq('module_id', moduleId).maybeSingle();
    if (existing) {
      await supabase.from('course_notes').update({ content: note }).eq('id', existing.id);
    } else {
      await supabase.from('course_notes').insert({ user_id: user.id, course_id: courseId, module_id: moduleId, content: note });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="card space-y-2 border-2 border-mly-200 dark:border-mly-800">
      <p className="text-xs text-gray-500 font-medium">📝 Your Notes (private)</p>
      <textarea value={note} onChange={e => setNote(e.target.value)} className="input-field !py-2 text-sm resize-none h-24 font-mono" placeholder="Take notes on this lesson..." />
      <button onClick={save} className="btn-primary text-xs !py-1.5 w-full">{saved ? '✓ Saved!' : 'Save Note'}</button>
    </div>
  );
}

// Discussion panel
function DiscussionPanel({ courseId, moduleId }: { courseId: string; moduleId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const { user } = useAppStore();
  const supabase = createClient();

  useEffect(() => {
    supabase.from('course_discussions').select('*, profiles!course_discussions_user_id_fkey(display_name)').eq('course_id', courseId).eq('module_id', moduleId).order('created_at', { ascending: false }).limit(20).then(({ data }) => { if (data) setComments(data); });
  }, [courseId, moduleId, supabase]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setPosting(true);
    const { data } = await supabase.from('course_discussions').insert({ course_id: courseId, module_id: moduleId, user_id: user.id, content: newComment.trim() }).select('*, profiles!course_discussions_user_id_fkey(display_name)').single();
    if (data) setComments(prev => [data, ...prev]);
    setNewComment('');
    setPosting(false);
  };

  const getRelativeTime = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (m < 1) return 'now'; if (m < 60) return `${m}m`; const h = Math.floor(m / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; };

  return (
    <div className="card space-y-3 border-2 border-teal-200 dark:border-teal-800">
      <p className="text-xs text-gray-500 font-medium">💬 Discussion ({comments.length})</p>
      <form onSubmit={post} className="flex gap-2">
        <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} className="input-field !py-2 text-xs flex-1" placeholder="Ask a question or share thoughts..." />
        <button type="submit" disabled={posting} className="btn-teal text-[10px] !py-2 !px-3 disabled:opacity-50">Post</button>
      </form>
      {comments.map(c => (
        <div key={c.id} className="flex gap-2">
          <div className="w-6 h-6 rounded-full bg-harbor-100 dark:bg-harbor-800 flex items-center justify-center text-[9px] font-bold flex-shrink-0">{c.profiles?.display_name?.charAt(0)?.toUpperCase() || '?'}</div>
          <div>
            <p className="text-[10px] text-gray-400"><strong className="text-harbor-800 dark:text-white">{c.profiles?.display_name}</strong> · {getRelativeTime(c.created_at)}</p>
            <p className="text-xs text-gray-700 dark:text-gray-300">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
