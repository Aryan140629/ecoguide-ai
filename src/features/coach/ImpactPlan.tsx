import { useState, useMemo, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProfile } from '../../hooks/useProfile';
import { useEmissions } from '../../hooks/useEmissions';
import { calculateTotalPotentialReduction } from '../../engine/recommendations';
import type { EmissionCategory, Difficulty } from '../../types/carbon';

type FilterCategory = EmissionCategory | 'all';

const CATEGORY_FILTERS: { value: FilterCategory; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '🌍' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'electricity', label: 'Energy', icon: '⚡' },
  { value: 'food', label: 'Food', icon: '🍽️' },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  moderate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  challenging: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  challenging: 'Challenging',
};

export function ImpactPlan() {
  const { adoptRecommendation, unadoptRecommendation } = useProfile();
  const { recommendations } = useEmissions();
  const [filter, setFilter] = useState<FilterCategory>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return recommendations;
    return recommendations.filter((r) => r.category === filter);
  }, [recommendations, filter]);

  const potential = useMemo(
    () => calculateTotalPotentialReduction(recommendations),
    [recommendations]
  );

  const adoptedCount = useMemo(
    () => recommendations.filter((r) => r.adopted).length,
    [recommendations]
  );

  const handleToggleAdopt = useCallback(
    (id: string, adopted: boolean) => {
      if (adopted) {
        unadoptRecommendation(id);
      } else {
        adoptRecommendation(id);
      }
    },
    [adoptRecommendation, unadoptRecommendation]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card variant="highlighted" padding="sm">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Potential Reduction
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {Math.round(potential.totalKgCO2).toLocaleString()} kg
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {potential.totalPercent}% of your footprint
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Actions Available
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
            {recommendations.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            personalized for you
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Adopted
          </p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {adoptedCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            of {recommendations.length} recommendations
          </p>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Filter by category">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.value}
            role="radio"
            aria-checked={filter === cat.value}
            onClick={() => setFilter(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === cat.value
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span aria-hidden="true">{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div className="space-y-4" role="list" aria-label="Recommendations">
        {filtered.map((rec, index) => (
          <Card
            key={rec.id}
            variant={rec.adopted ? 'highlighted' : 'default'}
            padding="md"
            role="listitem"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl" aria-hidden="true">
                {rec.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    #{index + 1}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[rec.difficulty]}`}>
                    {DIFFICULTY_LABELS[rec.difficulty]}
                  </span>
                  {rec.adopted && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                      ✓ Adopted
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-2">
                  {rec.action}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {rec.description}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      -{rec.estimatedReductionPercent}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({Math.round(rec.estimatedReductionKgCO2).toLocaleString()} kg CO₂/yr)
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant={rec.adopted ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => handleToggleAdopt(rec.id, rec.adopted)}
                aria-label={rec.adopted ? `Remove ${rec.action} from adopted` : `Adopt ${rec.action}`}
              >
                {rec.adopted ? 'Undo' : 'Adopt'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No recommendations in this category. You're doing great! 🎉
          </p>
        </Card>
      )}
    </div>
  );
}
