'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createSurplus } from '@/lib/actions/street';
import { FormField, inputStyles, textareaStyles, selectStyles, SubmitButton } from '@/components/ui/form-field';

const schema = z.object({
  title: z.string().min(3, 'Title required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['food', 'goods', 'clothing', 'furniture', 'other']),
  quantity: z.string().min(1).max(50),
  pickup_location: z.string().min(3, 'Pickup location required').max(200),
  available_hours: z.coerce.number().positive().max(72),
});

type FormData = z.infer<typeof schema>;

interface CreateSurplusModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateSurplusModal({ open, onClose, onSuccess }: CreateSurplusModalProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'food',
      quantity: '1',
      available_hours: 24,
    },
  });

  if (!open) return null;

  async function onSubmit(data: FormData) {
    setServerError(null);
    startTransition(async () => {
      const result = await createSurplus({
        ...data,
        description: data.description || undefined,
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
          <h2 className="text-lg font-semibold">Share Surplus</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Got extra food, clothes, or stuff you don't need? Share it before it goes to waste.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="What is it?" error={errors.title} required>
            <input {...register('title')} placeholder="e.g. 6 ripe tomatoes from my garden" className={inputStyles} />
          </FormField>

          <FormField label="Details" error={errors.description}>
            <textarea {...register('description')} placeholder="Any details (expiry date, size, condition...)" className={textareaStyles} rows={2} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" error={errors.category} required>
              <select {...register('category')} className={selectStyles}>
                <option value="food">🥫 Food</option>
                <option value="goods">📦 Goods</option>
                <option value="clothing">👕 Clothing</option>
                <option value="furniture">🪑 Furniture</option>
                <option value="other">🎁 Other</option>
              </select>
            </FormField>

            <FormField label="Quantity" error={errors.quantity} required>
              <input {...register('quantity')} placeholder="e.g. 6, 1 bag, 2 boxes" className={inputStyles} />
            </FormField>
          </div>

          <FormField label="Pickup Location" error={errors.pickup_location} required description="Where should people come get it?">
            <input {...register('pickup_location')} placeholder="e.g. My porch at 123 Elm St" className={inputStyles} />
          </FormField>

          <FormField label="Available for (hours)" error={errors.available_hours} description="Item expires after this time">
            <select {...register('available_hours')} className={selectStyles}>
              <option value="4">4 hours</option>
              <option value="8">8 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours (1 day)</option>
              <option value="48">48 hours (2 days)</option>
              <option value="72">72 hours (3 days)</option>
            </select>
          </FormField>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <SubmitButton loading={isPending} className="flex-1">
              Share It
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
