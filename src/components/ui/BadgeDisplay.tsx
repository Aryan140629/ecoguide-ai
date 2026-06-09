/**
 * BadgeDisplay Component
 *
 * Shows a sustainability badge with tier-based styling.
 */

import { memo } from 'react';
import type { Badge, BadgeTier } from '../../types/carbon';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
}

const tierColors: Record<BadgeTier, string> = {
  bronze: 'from-amber-600 to-amber-700 ring-amber-400/50',
  silver: 'from-slate-400 to-slate-500 ring-slate-300/50',
  gold: 'from-yellow-400 to-amber-500 ring-yellow-300/50',
  platinum: 'from-indigo-400 to-purple-500 ring-purple-300/50',
};



const sizeClasses = {
  sm: { wrapper: 'w-12 h-12', icon: 'text-lg', text: 'text-xs' },
  md: { wrapper: 'w-16 h-16', icon: 'text-2xl', text: 'text-sm' },
  lg: { wrapper: 'w-20 h-20', icon: 'text-3xl', text: 'text-sm' },
};

export const BadgeDisplay = memo(function BadgeDisplay({
  badge,
  size = 'md',
}: BadgeDisplayProps) {
  const earned = badge.earnedAt !== null;
  const sizes = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-all duration-300 ${
        earned ? 'opacity-100' : 'opacity-40 grayscale'
      }`}
      title={earned ? `${badge.name} — Earned!` : `${badge.name} — ${badge.requirement}`}
    >
      <div
        className={`${sizes.wrapper} rounded-full flex items-center justify-center ring-2 ${
          earned
            ? `bg-gradient-to-br ${tierColors[badge.tier]}`
            : 'bg-slate-200 dark:bg-slate-700 ring-slate-300/30'
        } shadow-lg transition-transform duration-300 ${earned ? 'hover:scale-110' : ''}`}
        role="img"
        aria-label={`${badge.name} badge${earned ? ' — earned' : ' — locked'}: ${badge.description}`}
      >
        <span className={sizes.icon} aria-hidden="true">
          {badge.icon}
        </span>
      </div>
      <span
        className={`${sizes.text} font-medium text-center text-slate-700 dark:text-slate-300 max-w-[80px] leading-tight`}
      >
        {badge.name}
      </span>
    </div>
  );
});
