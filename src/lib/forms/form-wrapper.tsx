'use client';

import * as React from 'react';
import { useForm, FormProvider, type FieldValues, type DefaultValues, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ZodSchema } from 'zod';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface FormWrapperProps<T extends FieldValues> {
  schema: ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
  className?: string;
  submitLabel?: string;
  submitting?: boolean;
  submitClassName?: string;
  resetOnSuccess?: boolean;
}

/**
 * Production-ready form wrapper that combines react-hook-form + Zod validation.
 * Wraps children in FormProvider for nested FormInput/FormTextarea/FormSelect components.
 * 
 * Usage:
 * ```tsx
 * <FormWrapper schema={myZodSchema} onSubmit={handleSubmit} submitLabel="Create">
 *   <FormInput name="title" label="Title" placeholder="Enter title" />
 *   <FormTextarea name="description" label="Description" rows={4} />
 * </FormWrapper>
 * ```
 */
export function FormWrapper<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  className,
  submitLabel = 'Submit',
  submitting = false,
  submitClassName,
  resetOnSuccess = false,
}: FormWrapperProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const handleSubmit = async (data: T) => {
    await onSubmit(data);
    if (resetOnSuccess) {
      methods.reset();
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmit)} className={cn('space-y-3', className)}>
        {children}
        <Button
          type="submit"
          disabled={submitting || methods.formState.isSubmitting}
          className={cn('w-full', submitClassName)}
        >
          {submitting || methods.formState.isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </FormProvider>
  );
}
