'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/lib/store/app-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface ModuleBuilder {
  id: string;
  title: string;
  contentType: 'text' | 'video' | 'mixed';
  content: string;
  videoUrl: string;
  quiz: { question: string; options: string[]; correct: number }[];
}

const categories = ['Legal & Rights', 'Financial', 'Health', 'Digital', 'Civic', 'Career', 'Life Skills'];

export default function CreateCoursePage() {
  const [step, setStep] = useState<'info' | 'modules' | 'review'>('info');

  // Course info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Life Skills');
  const [difficulty, setDifficulty] = useState('beginner');
  const [mlyReward, setMlyReward] = useState('5');

  // Modules
  const [modules, setModules] = useState<ModuleBuilder[]>([
    { id: '1', title: '', contentType: 'text', content: '', videoUrl: '', quiz: [] }
  ]);

  const [activeModule, setActiveModule] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const { user } = useAppStore();
  const supabase = createClient();
  const router = useRouter();

  const addModule = () => {
    setModules(prev => [...prev, { id: String(prev.length + 1), title: '', contentType: 'text', content: '', videoUrl: '', quiz: [] }]);
    setActiveModule(modules.length);
  };

  const removeModule = (idx: number) => {
    if (modules.length <= 1) return;
    setModules(prev => prev.filter((_, i) => i !== idx));
    setActiveModule(Math.max(0, activeModule - 1));
  };

  const updateModule = (idx: number, updates: Partial<ModuleBuilder>) => {
    setModules(prev => prev.map((m, i) => i === idx ? { ...m, ...updates } : m));
  };

  const addQuiz = (moduleIdx: number) => {
    const mod = modules[moduleIdx];
    updateModule(moduleIdx, { quiz: [...mod.quiz, { question: '', options: ['', '', '', ''], correct: 0 }] });
  };

  const updateQuiz = (moduleIdx: number, quizIdx: number, updates: any) => {
    const mod = modules[moduleIdx];
    const newQuiz = mod.quiz.map((q, i) => i === quizIdx ? { ...q, ...updates } : q);
    updateModule(moduleIdx, { quiz: newQuiz });
  };

  const removeQuiz = (moduleIdx: number, quizIdx: number) => {
    const mod = modules[moduleIdx];
    updateModule(moduleIdx, { quiz: mod.quiz.filter((_, i) => i !== quizIdx) });
  };

  const handlePublish = async () => {
    if (!user) return;
    setPublishing(true);

    // Build modules JSON
    const modulesJson = modules.map((m, i) => ({
      id: `m${i + 1}`,
      title: m.title || `Module ${i + 1}`,
      content: m.contentType === 'video' ? `[Video: ${m.videoUrl}]\n\n${m.content}` : m.content,
      videoUrl: m.videoUrl || undefined,
      quiz: m.quiz.filter(q => q.question.trim()),
    }));

    const { error } = await supabase.from('courses').insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty,
      mly_reward: parseFloat(mlyReward) || 5,
      modules: modulesJson,
      published: true,
    });

    if (!error) {
      setPublished(true);
      // Award creator MLY for publishing
      await supabase.from('mly_transactions').insert({ to_id: user.id, amount: 10, type: 'earn', description: `Published course: ${title.trim()}` });
      await supabase.rpc('increment_balance', { user_id: user.id, amount: 10 });
    }

    setPublishing(false);
  };

  if (published) {
    return (
      <div className="space-y-6 animate-slide-up text-center py-12">
        <div className="text-5xl">🎉</div>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Course Published!</h1>
        <p className="text-gray-500">+$10 MLY earned. Your community can now learn from you.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push('/learn')} className="btn-teal text-sm">View Courses</button>
          <button onClick={() => { setPublished(false); setStep('info'); setTitle(''); setDescription(''); setModules([{ id: '1', title: '', contentType: 'text', content: '', videoUrl: '', quiz: [] }]); }} className="btn-primary text-sm">Create Another</button>
        </div>
      </div>
    );
  }

  const mod = modules[activeModule];

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/learn')} className="text-teal-500 text-sm">← MiLearn</button>
        <h1 className="text-xl font-bold text-harbor-800 dark:text-white">Create Course</h1>
      </div>

      {/* Step Indicator */}
      <div className="flex gap-1">
        {['info', 'modules', 'review'].map((s, i) => (
          <div key={s} className={cn('flex-1 h-1.5 rounded-full transition-colors', step === s ? 'bg-teal-500' : i < ['info', 'modules', 'review'].indexOf(step) ? 'bg-teal-300' : 'bg-gray-200 dark:bg-harbor-700')} />
        ))}
      </div>

      {/* Step 1: Course Info */}
      {step === 'info' && (
        <div className="card space-y-4">
          <h2 className="font-medium text-harbor-800 dark:text-white">Course Details</h2>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field !py-2.5 text-sm" placeholder="e.g., Understanding Your Tenant Rights" maxLength={100} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field !py-2.5 text-sm resize-none h-20" placeholder="What will learners gain from this course?" maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field !py-2.5 text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input-field !py-2.5 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">$MLY Reward on Completion</label>
            <input type="number" value={mlyReward} onChange={e => setMlyReward(e.target.value)} className="input-field !py-2.5 text-sm" min="1" max="50" />
            <p className="text-[10px] text-gray-400 mt-0.5">Learners earn this amount when they finish all modules.</p>
          </div>

          <button onClick={() => setStep('modules')} disabled={!title.trim() || !description.trim()} className="btn-teal w-full disabled:opacity-50">
            Next: Build Modules →
          </button>
        </div>
      )}

      {/* Step 2: Module Builder */}
      {step === 'modules' && (
        <div className="space-y-4">
          {/* Module tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {modules.map((m, i) => (
              <button key={i} onClick={() => setActiveModule(i)} className={cn('px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all', activeModule === i ? 'bg-harbor-800 text-white dark:bg-teal-500' : 'bg-gray-100 dark:bg-harbor-800 text-gray-600 dark:text-gray-300')}>
                {m.title || `Module ${i + 1}`}
              </button>
            ))}
            <button onClick={addModule} className="px-3 py-2 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-600 whitespace-nowrap">+ Add</button>
          </div>

          {/* Active module editor */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-harbor-800 dark:text-white">Module {activeModule + 1}</h3>
              {modules.length > 1 && <button onClick={() => removeModule(activeModule)} className="text-xs text-red-400">Remove</button>}
            </div>

            <input type="text" value={mod.title} onChange={e => updateModule(activeModule, { title: e.target.value })} className="input-field !py-2 text-sm" placeholder="Module title" />

            {/* Content type */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Content Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ val: 'text', icon: '📝', label: 'Text' }, { val: 'video', icon: '🎬', label: 'Video' }, { val: 'mixed', icon: '📝🎬', label: 'Both' }].map(t => (
                  <button key={t.val} onClick={() => updateModule(activeModule, { contentType: t.val as any })} className={cn('py-2 rounded-lg border-2 text-center text-xs font-medium transition-all', mod.contentType === t.val ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-harbor-700')}>
                    <span className="text-lg block">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video URL */}
            {(mod.contentType === 'video' || mod.contentType === 'mixed') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Video URL (YouTube, Vimeo, or direct link)</label>
                <input type="url" value={mod.videoUrl} onChange={e => updateModule(activeModule, { videoUrl: e.target.value })} className="input-field !py-2 text-sm" placeholder="https://youtube.com/watch?v=..." />
              </div>
            )}

            {/* Text content */}
            {(mod.contentType === 'text' || mod.contentType === 'mixed') && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Lesson Content</label>
                <textarea value={mod.content} onChange={e => updateModule(activeModule, { content: e.target.value })} className="input-field !py-2 text-sm resize-none h-40 font-mono" placeholder="Write your lesson content here. Use line breaks for paragraphs. Learners will read this." />
                <p className="text-[10px] text-gray-400 mt-0.5">{mod.content.length} chars · Tip: Use bullet points (•) and line breaks for readability.</p>
              </div>
            )}

            {/* Quiz Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-500 font-medium">Quiz Questions (optional)</label>
                <button onClick={() => addQuiz(activeModule)} className="text-xs text-teal-500 font-medium">+ Add Question</button>
              </div>

              {mod.quiz.map((q, qi) => (
                <div key={qi} className="p-3 rounded-xl bg-gray-50 dark:bg-harbor-800 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-gray-400">Q{qi + 1}</span>
                    <button onClick={() => removeQuiz(activeModule, qi)} className="text-[10px] text-red-400">Remove</button>
                  </div>
                  <input type="text" value={q.question} onChange={e => updateQuiz(activeModule, qi, { question: e.target.value })} className="input-field !py-1.5 text-xs" placeholder="Question text" />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button onClick={() => updateQuiz(activeModule, qi, { correct: oi })} className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors', q.correct === oi ? 'border-teal-500 bg-teal-500' : 'border-gray-300 dark:border-harbor-600')}>
                        {q.correct === oi && <span className="text-white text-[8px]">✓</span>}
                      </button>
                      <input type="text" value={opt} onChange={e => { const newOpts = [...q.options]; newOpts[oi] = e.target.value; updateQuiz(activeModule, qi, { options: newOpts }); }} className="input-field !py-1.5 text-xs flex-1" placeholder={`Option ${oi + 1}`} />
                    </div>
                  ))}
                  <p className="text-[9px] text-gray-400">Click the circle to mark the correct answer.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="btn-primary flex-1 text-sm">← Back</button>
            <button onClick={() => setStep('review')} disabled={modules.some(m => !m.title.trim() || (!m.content.trim() && !m.videoUrl.trim()))} className="btn-teal flex-1 text-sm disabled:opacity-50">Review & Publish →</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h2 className="text-base font-bold text-harbor-800 dark:text-white">{title}</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300">{description}</p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs bg-harbor-100 dark:bg-harbor-800 px-2 py-0.5 rounded-full">{category}</span>
              <span className="text-xs bg-harbor-100 dark:bg-harbor-800 px-2 py-0.5 rounded-full capitalize">{difficulty}</span>
              <span className="text-xs bg-mly-100 dark:bg-mly-900/20 text-mly-700 px-2 py-0.5 rounded-full">+${mlyReward} MLY</span>
              <span className="text-xs bg-harbor-100 dark:bg-harbor-800 px-2 py-0.5 rounded-full">{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {modules.map((m, i) => (
            <div key={i} className="card space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Module {i + 1}</span>
                <span className="text-xs bg-gray-100 dark:bg-harbor-800 px-1.5 py-0.5 rounded capitalize">{m.contentType}</span>
              </div>
              <p className="text-sm font-medium text-harbor-800 dark:text-white">{m.title}</p>
              <p className="text-xs text-gray-500">{m.content.length > 0 ? `${m.content.slice(0, 80)}...` : 'Video lesson'} · {m.quiz.length} quiz question{m.quiz.length !== 1 ? 's' : ''}</p>
            </div>
          ))}

          <div className="flex gap-3">
            <button onClick={() => setStep('modules')} className="btn-primary flex-1 text-sm">← Edit</button>
            <button onClick={handlePublish} disabled={publishing} className="btn-gold flex-1 text-sm disabled:opacity-50">
              {publishing ? 'Publishing...' : '🎓 Publish Course (+$10 MLY)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
