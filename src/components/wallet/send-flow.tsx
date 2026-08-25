'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { transferMLY } from '@/lib/actions/wallet';
import { executeWithOfflineFallback } from '@/lib/offline/action-wrapper';
import { FormField, inputStyles, textareaStyles, selectStyles, SubmitButton } from '@/components/ui/form-field';

const schema = z.object({
  toUsername: z.string().min(3, 'Username must be at least 3 characters').max(24),
  amount: z.coerce.number().positive('Amount must be positive').max(10000, 'Max 10,000 per transfer'),
  pot: z.enum(['spending', 'savings', 'community']),
  reason: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

interface SendFlowProps {
  balance: { spending: number; savings: number; community: number };
  onSuccess: () => void;
  onCancel: () => void;
  prefillUsername?: string;
  prefillAmount?: number;
  prefillReason?: string;
}

type Step = 'form' | 'confirm' | 'success';

export function SendFlow({ balance, onSuccess, onCancel, prefillUsername, prefillAmount, prefillReason }: SendFlowProps) {
  const [step, setStep] = useState<Step>('form');
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<{ amount: number; to: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      toUsername: prefillUsername || '',
      amount: prefillAmount || undefined,
      pot: 'spending',
      reason: prefillReason || '',
    },
  });

  const selectedPot = watch('pot');
  const potBalance = balance[selectedPot as keyof typeof balance] || 0;

  function onFormSubmit(data: FormData) {
    if (data.amount > potBalance) {
      setServerError(`Insufficient balance. You have ${potBalance} $MLY in ${data.pot}.`);
      return;
    }
    setFormData(data);
    setServerError(null);
    setStep('confirm');
  }

  function handleConfirm() {
    if (!formData) return;
    setServerError(null);
    startTransition(async () => {
      const res = await executeWithOfflineFallback(
        'pocket.thank',
        { toUsername: formData.toUsername, amount: formData.amount, pot: formData.pot, reason: formData.reason },
        () => transferMLY({ toUsername: formData.toUsername, amount: formData.amount, pot: formData.pot }),
      );
      if (res.error) {
        setServerError(res.error);
        setStep('form');
      } else {
        setResult({ amount: formData.amount, to: formData.toUsername });
        setStep('success');
      }
    });
  }

  // Step: Form
  if (step === 'form') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Send $MLY</h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <FormField label="To (username)" error={errors.toUsername} required>
            <input {...register('toUsername')} placeholder="@username" className={inputStyles} autoFocus />
          </FormField>

          <FormField label="Amount ($MLY)" error={errors.amount} required>
            <input {...register('amount')} type="number" min="1" step="1" placeholder="0" className={inputStyles} />
            <p className="mt-1 text-xs text-muted-foreground">
              Available in {selectedPot}: <strong>{potBalance} $MLY</strong>
            </p>
          </FormField>

          <FormField label="From pot" error={errors.pot}>
            <select {...register('pot')} className={selectStyles}>
              <option value="spending">Spending ({balance.spending} $MLY)</option>
              <option value="savings">Savings ({balance.savings} $MLY)</option>
              <option value="community">Community ({balance.community} $MLY)</option>
            </select>
          </FormField>

          <FormField label="Reason (optional)" error={errors.reason}>
            <input {...register('reason')} placeholder="For fixing the gate..." className={inputStyles} />
          </FormField>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex gap-3">
            <SubmitButton loading={false} className="flex-1">
              Review →
            </SubmitButton>
            <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2.5 text-sm text-muted-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step: Confirm
  if (step === 'confirm' && formData) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Confirm Transfer</h2>

        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">To</span>
            <span className="font-medium">@{formData.toUsername}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="text-xl font-bold text-green-600">{formData.amount} $MLY</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">From</span>
            <span className="capitalize">{formData.pot} pot</span>
          </div>
          {formData.reason && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reason</span>
              <span className="text-sm">{formData.reason}</span>
            </div>
          )}
        </div>

        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? 'Sending...' : 'Confirm & Send'}
          </button>
          <button onClick={() => setStep('form')} className="rounded-md border px-4 py-2.5 text-sm text-muted-foreground">
            Back
          </button>
        </div>
      </div>
    );
  }

  // Step: Success
  if (step === 'success' && result) {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="text-5xl animate-bounce">💸</div>
        <h2 className="text-xl font-bold text-green-600">Sent!</h2>
        <p className="text-muted-foreground">
          {result.amount} $MLY sent to @{result.to}
        </p>
        <button
          onClick={onSuccess}
          className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Done
        </button>
      </div>
    );
  }

  return null;
}
