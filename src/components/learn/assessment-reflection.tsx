'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { submitAssessment } from '@/lib/actions/learn';
import { FormField, textareaStyles, SubmitButton } from '@/components/ui/form-field';

const schema = z.object({
  response: z.string().min(50, 'Please write at least 50 characters').max(5000),
  link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface AssessmentReflectionProps {
  moduleId: string;
  type: 'reflection' | 'portfolio' | 'project';
  onComplete: () => void;
}

const PROMPTS: Record<string, { title: string; placeholder: string; showLink: boolean }> = {
  reflection: {
    title: 'Reflection',
    placeholder: 'What did you learn? How does this connect to your life? What would you do differently knowing this?',
    showLink: false,
  },
  portfolio: {
    title: 'Portfolio Submission',
    placeholder: 'Describe what you created or accomplished. Include details about your process and what you learned.',
    showLink: true,
  },
  project: {
    title: 'Project Submission',
    placeholder: 'Describe your community project: what you did, who it helped, what happened, and what you learned from it.',
    showLink: true,
  },
};

export function AssessmentReflection({ moduleId, type, onComplete }: AssessmentReflectionProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const prompt = PROMPTS[type] || PROMPTS.reflection;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    startTransition(async () => {
      const result = await submitAssessment({
        module_id: moduleId,
        assessment_type: type as any,
        data: { response: data.response, link: data.link || undefined },
      });
      if (result.error) {
        setServerError(result.error);
      } else {
        onComplete();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{prompt.title}</p>
        <p className="mt-1">Take your time with this. There's no wrong answer — this is about your experience and growth.</p>
      </div>

      <FormField label="Your Response" error={errors.response} required>
        <textarea
          {...register('response')}
          placeholder={prompt.placeholder}
          className={textareaStyles}
          rows={6}
        />
      </FormField>

      {prompt.showLink && (
        <FormField label="Link (optional)" error={errors.link} description="Link to your project, portfolio, or evidence">
          <input
            {...register('link')}
            placeholder="https://..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </FormField>
      )}

      {serverError && (
        <p className="text-sm text-red-500">{serverError}</p>
      )}

      <SubmitButton loading={isPending}>
        Submit {prompt.title}
      </SubmitButton>
    </form>
  );
}
