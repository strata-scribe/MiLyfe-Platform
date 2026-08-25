'use client';

import { useState, useTransition } from 'react';
import { submitAssessment } from '@/lib/actions/learn';

interface AssessmentQuizProps {
  moduleId: string;
  onComplete: () => void;
}

// Sample quiz questions — in production these come from the module's metadata
const SAMPLE_QUESTIONS = [
  {
    id: '1',
    question: 'What is the first thing you should do if you\'re stopped by police?',
    options: [
      'Run away',
      'Stay calm, be polite, and ask if you are free to leave',
      'Argue about your rights',
      'Refuse to identify yourself',
    ],
    correct: 1,
  },
  {
    id: '2',
    question: 'If you cannot afford a lawyer, you have the right to:',
    options: [
      'A free attorney appointed by the court (public defender)',
      'Nothing — legal aid is only for the wealthy',
      'Represent yourself only',
      'Hire one on credit',
    ],
    correct: 0,
  },
  {
    id: '3',
    question: 'Which of these is NOT required for most jobs?',
    options: [
      'Social Security number',
      'Work authorization',
      'A college degree',
      'Valid ID (state ID, passport, etc.)',
    ],
    correct: 2,
  },
];

export function AssessmentQuiz({ moduleId, onComplete }: AssessmentQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allAnswered = Object.keys(answers).length === SAMPLE_QUESTIONS.length;
  const score = submitted
    ? SAMPLE_QUESTIONS.filter((q) => answers[q.id] === q.correct).length
    : 0;
  const passed = score >= Math.ceil(SAMPLE_QUESTIONS.length * 0.7);

  function handleSubmit() {
    setSubmitted(true);

    if (passed) {
      startTransition(async () => {
        await submitAssessment({
          module_id: moduleId,
          assessment_type: 'quiz',
          data: { answers, score, total: SAMPLE_QUESTIONS.length },
        });
        onComplete();
      });
    }
  }

  return (
    <div className="space-y-6">
      {SAMPLE_QUESTIONS.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <p className="font-medium">
            {qi + 1}. {q.question}
          </p>
          <div className="space-y-1.5 pl-4">
            {q.options.map((option, oi) => {
              const isSelected = answers[q.id] === oi;
              const isCorrect = submitted && oi === q.correct;
              const isWrong = submitted && isSelected && oi !== q.correct;

              return (
                <label
                  key={oi}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                    isCorrect
                      ? 'border-green-500 bg-green-50'
                      : isWrong
                        ? 'border-red-500 bg-red-50'
                        : isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={isSelected}
                    onChange={() => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                    disabled={submitted}
                    className="h-4 w-4"
                  />
                  <span>{option}</span>
                  {isCorrect && <span className="ml-auto text-green-600">✓</span>}
                  {isWrong && <span className="ml-auto text-red-600">✗</span>}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Submit Answers
        </button>
      )}

      {submitted && (
        <div className={`rounded-lg p-4 text-center ${passed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border`}>
          <p className="font-medium">
            Score: {score}/{SAMPLE_QUESTIONS.length} ({Math.round((score / SAMPLE_QUESTIONS.length) * 100)}%)
          </p>
          {passed ? (
            <p className="text-sm text-green-700 mt-1">You passed! Moving on...</p>
          ) : (
            <div>
              <p className="text-sm text-yellow-700 mt-1">Need 70% to pass. Review and try again.</p>
              <button
                onClick={() => { setSubmitted(false); setAnswers({}); }}
                className="mt-3 rounded-md border px-4 py-2 text-sm hover:bg-muted"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
