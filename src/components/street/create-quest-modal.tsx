'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createQuest } from '@/lib/actions/street';
import { FormField, inputStyles, textareaStyles, selectStyles, SubmitButton } from '@/components/ui/form-field';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Describe the task in detail (at least 20 chars)').max(2000),
  category: z.enum([
    'community', 'cleanup', 'repair', 'delivery', 'teaching',
    'caregiving', 'verification', 'safety', 'gardening', 'tech_support',
  ]),
  reward_mly: z.coerce.number().positive('Reward must be positive').max(500, 'Max 500 $MLY per quest'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  time_estimate_minutes: z.coerce.number().positive().max(480).optional(),
  location_text: z.string().max(200).optional(),
  max_completions: z.coerce.number().int().positive().max(20),
  expires_days: z.coerce.number().int().positive().max(30),
});

type FormData = z.infer<typeof schema>;

interface CreateQuestModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateQuestModal({ open, onClose, onSuccess }: CreateQuestModalProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'community',
      difficulty: 'easy',
      max_completions: 1,
      expires_days: 7,
    },
  });

  if (!open) return null;

  async function onSubmit(data: FormData) {
    setServerError(null);
    startTransition(async () => {
      const result = await createQuest({
        ...data,
        time_estimate_minutes: data.time_estimate_minutes || undefined,
        location_text: data.location_text || undefined,
      });
      if (result.error) {
        setServerError(result.error);
      } else {
        reset();
        onSuccess?.();
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Post a Quest</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Create a real task that improves the community. You fund the reward from your wallet.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Quest Title" error={errors.title} required>
            <input {...register('title')} placeholder="e.g. Clean up the park on Elm Street" className={inputStyles} />
          </FormField>

          <FormField label="Description" error={errors.description} required description="What needs to be done? Be specific.">
            <textarea {...register('description')} placeholder="Describe exactly what the person needs to do, where, and how you'll verify it's done..." className={textareaStyles} rows={4} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" error={errors.category} required>
              <select {...register('category')} className={selectStyles}>
                <option value="community">🏘️ Community</option>
                <option value="cleanup">🧹 Cleanup</option>
                <option value="repair">🔧 Repair</option>
                <option value="delivery">🚚 Delivery</option>
                <option value="teaching">📚 Teaching</option>
                <option value="caregiving">💜 Caregiving</option>
                <option value="verification">✅ Verification</option>
                <option value="safety">🛡️ Safety</option>
                <option value="gardening">🌱 Gardening</option>
                <option value="tech_support">💻 Tech Support</option>
              </select>
            </FormField>

            <FormField label="Difficulty" error={errors.difficulty} required>
              <select {...register('difficulty')} className={selectStyles}>
                <option value="easy">Easy (~15-30 min)</option>
                <option value="medium">Medium (~1-2 hours)</option>
                <option value="hard">Hard (~half day+)</option>
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Reward ($MLY)" error={errors.reward_mly} required description="Funded from your wallet">
              <input {...register('reward_mly')} type="number" min="1" max="500" placeholder="10" className={inputStyles} />
            </FormField>

            <FormField label="Time Estimate (min)" error={errors.time_estimate_minutes}>
              <input {...register('time_estimate_minutes')} type="number" min="5" max="480" placeholder="30" className={inputStyles} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max Completions" error={errors.max_completions} description="How many people can do this?">
              <input {...register('max_completions')} type="number" min="1" max="20" className={inputStyles} />
            </FormField>

            <FormField label="Expires In (days)" error={errors.expires_days}>
              <input {...register('expires_days')} type="number" min="1" max="30" className={inputStyles} />
            </FormField>
          </div>

          <FormField label="Location" error={errors.location_text} description="Where does this need to happen?">
            <input {...register('location_text')} placeholder="e.g. Elm Street Park" className={inputStyles} />
          </FormField>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <SubmitButton loading={isPending} className="flex-1">
              Post Quest
            </SubmitButton>
            <button type="button" onClick={onClose} className="rounded-md border px-4 py-2.5 text-sm text-muted-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
