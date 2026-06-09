/**
 * Select Component
 *
 * Accessible select dropdown with label and error display.
 */

import { type SelectHTMLAttributes, type ReactNode, memo, useId } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export const Select = memo(function Select({
  label,
  error,
  hint,
  children,
  size = 'md',
  id: externalId,
  className = '',
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = externalId ?? generatedId;
  const errorId = `${selectId}-error`;
  const hintId = `${selectId}-hint`;

  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm';

  const describedBy = [
    error ? errorId : null,
    hint ? hintId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {props.required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id={selectId}
        className={`${sizeClasses} rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer ${
          error
            ? 'border-red-400 dark:border-red-500'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
        }`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
