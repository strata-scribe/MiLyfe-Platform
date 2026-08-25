'use client';

import { type ReactNode } from 'react';
import { type FieldError } from 'react-hook-form';

/**
 * Reusable form field wrapper with label, error display, and description.
 * Works with react-hook-form register pattern.
 */
interface FormFieldProps {
  label: string;
  error?: FieldError;
  description?: string;
  required?: boolean;
  children: ReactNode;
}

export function FormField({ label, error, description, required, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-500" role="alert">{error.message}</p>
      )}
    </div>
  );
}

/**
 * Common input styles to use with react-hook-form register.
 */
export const inputStyles =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export const textareaStyles =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-y';

export const selectStyles =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Submit button with loading state.
 */
interface SubmitButtonProps {
  loading: boolean;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SubmitButton({ loading, children, disabled, className }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50 ${className || ''}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Working...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
