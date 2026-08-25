'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { giveAttestation } from '@/lib/actions/profile';
import { FormField, inputStyles, selectStyles, SubmitButton } from '@/components/ui/form-field';

const schema = z.object({
  facet: z.enum(['neighbor', 'carer', 'maker', 'teacher', 'keeper', 'voice', 'shop', 'helper']),
  reason: z.string().min(5, 'At least 5 characters').max(200),
});

type FormData = z.infer<typeof schema>;

interface GiveAttestationProps {
  toUserId: string;
  toDisplayName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FACET_OPTIONS = [
  { value: 'neighbor', label: '🏘️ Neighbor — good community member' },
  { value: 'carer', label: '💜 Carer — helps people in need' },
  { value: 'maker', label: '🔧 Maker — builds and repairs things' },
  { value: 'teacher', label: '📚 Teacher — shares knowledge' },
  { value: 'keeper', label: '🛡️ Keeper — keeps community safe' },
  { value: 'voice', label: '🗳️ Voice — participates in governance' },
  { value: 'shop', label: '🛒 Shop — runs business, sells goods' },
  { value: 'helper', label: '🤝 Helper — assists others regularly' },
];

export function GiveAttestation({ toUserId, toDisplayName, open, onClose, onSuccess }: GiveAttestationProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { facet: 'neighbor' },
  });

  if (!open) return null;

  async function onSubmit(data: FormData) {
    setServerError(null);
    startTransition(async () => {
      const result = await giveAttestation({
        to_user_id: toUserId,
        facet: data.facet,
        reason: data.reason,
        weight: 1,
      });
      if (result.error) {
        setServerError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          reset();
          setSuccess(false);
          onSuccess?.();
          onClose();
        }, 1500);
      }
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-xl bg-background p-8 text-center shadow-xl">
          <span className="text-5xl">✨</span>
          <p className="mt-3 text-lg font-bold">Attestation sent!</p>
          <p className="text-sm text-muted-foreground">{toDisplayName}'s standing updated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recognize {toDisplayName}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Attestations build community standing. Recognize what this person contributes.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="What do you recognize?" error={errors.facet} required>
            <select {...register('facet')} className={selectStyles}>
              {FACET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Why?" error={errors.reason} required description="What did they do? Be specific.">
            <input
              {...register('reason')}
              placeholder="e.g. Fixed my bike for free last Tuesday"
              className={inputStyles}
            />
          </FormField>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex gap-3">
            <SubmitButton loading={isPending} className="flex-1">
              Send Recognition
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
