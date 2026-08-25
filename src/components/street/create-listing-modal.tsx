'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createListing } from '@/lib/actions/street';
import { FormField, inputStyles, textareaStyles, selectStyles, SubmitButton } from '@/components/ui/form-field';
import { ImageUpload } from '@/components/street/image-upload';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.enum(['food', 'services', 'rides', 'goods', 'education', 'housing', 'jobs']),
  price_mly: z.coerce.number().min(0).max(100000),
  price_type: z.enum(['fixed', 'negotiable', 'free', 'trade']),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'parts']).optional(),
  location_text: z.string().max(200).optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateListingModal({ open, onClose, onSuccess }: CreateListingModalProps) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'goods',
      price_type: 'fixed',
      price_mly: 0,
    },
  });

  const priceType = watch('price_type');

  if (!open) return null;

  async function onSubmit(data: FormData) {
    setServerError(null);
    startTransition(async () => {
      const result = await createListing({
        ...data,
        images,
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
          <h2 className="text-lg font-semibold">List an Item</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Title" error={errors.title} required>
            <input {...register('title')} placeholder="What are you selling?" className={inputStyles} />
          </FormField>

          <FormField label="Description" error={errors.description} required>
            <textarea {...register('description')} placeholder="Describe the item, condition, and any details..." className={textareaStyles} rows={3} />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category" error={errors.category} required>
              <select {...register('category')} className={selectStyles}>
                <option value="food">🍎 Food</option>
                <option value="goods">📦 Goods</option>
                <option value="services">🔧 Services</option>
                <option value="rides">🚗 Rides</option>
                <option value="education">📚 Education</option>
                <option value="housing">🏠 Housing</option>
                <option value="jobs">💼 Jobs</option>
              </select>
            </FormField>

            <FormField label="Price Type" error={errors.price_type} required>
              <select {...register('price_type')} className={selectStyles}>
                <option value="fixed">Fixed Price</option>
                <option value="negotiable">Negotiable</option>
                <option value="free">Free</option>
                <option value="trade">Trade</option>
              </select>
            </FormField>
          </div>

          {priceType !== 'free' && (
            <FormField label="Price ($MLY)" error={errors.price_mly}>
              <input {...register('price_mly')} type="number" min="0" step="1" placeholder="0" className={inputStyles} />
            </FormField>
          )}

          <FormField label="Condition" error={errors.condition}>
            <select {...register('condition')} className={selectStyles}>
              <option value="">Not applicable</option>
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="parts">For Parts</option>
            </select>
          </FormField>

          <FormField label="Location" error={errors.location_text} description="Where can the buyer pick this up?">
            <input {...register('location_text')} placeholder="e.g. Eastside, near Elm St" className={inputStyles} />
          </FormField>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium">Photos</label>
            <div className="mt-1.5">
              <ImageUpload images={images} onChange={setImages} maxImages={5} />
            </div>
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <SubmitButton loading={isPending} className="flex-1">
              Post Listing
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
