/**
 * Card Component
 *
 * Reusable glassmorphism card with variants.
 */

import { type ReactNode, type HTMLAttributes, memo } from 'react';

type CardVariant = 'default' | 'highlighted' | 'warning' | 'glass';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white/80 dark:bg-slate-800/80 border-slate-200/50 dark:border-slate-700/50',
  highlighted: 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-300/50 dark:border-emerald-700/50',
  warning: 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-300/50 dark:border-amber-700/50',
  glass: 'bg-white/30 dark:bg-slate-800/30 border-white/20 dark:border-slate-600/20',
};

const paddingClasses: Record<string, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = memo(function Card({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border backdrop-blur-sm shadow-lg transition-all duration-300 hover:shadow-xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
