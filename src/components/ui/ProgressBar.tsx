/**
 * ProgressBar Component
 *
 * Accessible progress indicator with animated fill,
 * color-coded by percentage.
 */

import { memo } from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getProgressColor(percent: number): string {
  if (percent >= 80) return 'from-emerald-400 to-emerald-600';
  if (percent >= 50) return 'from-teal-400 to-cyan-500';
  if (percent >= 25) return 'from-amber-400 to-orange-500';
  return 'from-red-400 to-red-500';
}

const sizeHeights: Record<string, string> = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export const ProgressBar = memo(function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = true,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const colorClass = getProgressColor(percent);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        {showPercent && (
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {Math.round(percent)}%
          </span>
        )}
      </div>
      <div
        className={`w-full ${sizeHeights[size]} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${Math.round(percent)}%`}
      >
        <div
          className={`${sizeHeights[size]} bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
});
