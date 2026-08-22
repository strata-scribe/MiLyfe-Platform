'use client';

import * as React from 'react';
import { useFormContext, Controller, type FieldValues, type Path } from 'react-hook-form';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'url' | 'tel';
  className?: string;
  disabled?: boolean;
  description?: string;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  placeholder,
  type = 'text',
  className,
  disabled,
  description,
}: FormFieldProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const error = errors[name];

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={name} className="text-xs font-medium text-harbor-800 dark:text-white">
          {label}
        </label>
      )}
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name, { valueAsNumber: type === 'number' })}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
      />
      {description && !error && (
        <p className="text-[10px] text-gray-400">{description}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-500">{error.message as string}</p>
      )}
    </div>
  );
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  placeholder,
  className,
  disabled,
  description,
  rows = 3,
}: FormFieldProps<T> & { rows?: number }) {
  const { register, formState: { errors } } = useFormContext<T>();
  const error = errors[name];

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={name} className="text-xs font-medium text-harbor-800 dark:text-white">
          {label}
        </label>
      )}
      <Textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        {...register(name)}
        className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
      />
      {description && !error && (
        <p className="text-[10px] text-gray-400">{description}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-500">{error.message as string}</p>
      )}
    </div>
  );
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  className,
  disabled,
}: FormSelectProps<T>) {
  const { register, formState: { errors } } = useFormContext<T>();
  const error = errors[name];

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <label htmlFor={name} className="text-xs font-medium text-harbor-800 dark:text-white">
          {label}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        {...register(name)}
        className={cn(
          'flex h-10 w-full rounded-lg border border-gray-200 dark:border-harbor-700 bg-white dark:bg-harbor-900 px-3 py-2 text-sm text-harbor-800 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 transition-colors',
          error && 'border-red-500 focus-visible:ring-red-500'
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p className="text-[10px] text-red-500">{error.message as string}</p>
      )}
    </div>
  );
}
