/**
 * Goals & Badges Feature
 *
 * Set reduction targets, track progress, and showcase earned badges.
 */

import { useState, useMemo, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { BadgeDisplay } from '../../components/ui/BadgeDisplay';
import { useProfile } from '../../hooks/useProfile';
import { useEmissions } from '../../hooks/useEmissions';
import { useGoals } from '../../hooks/useGoals';
import { evaluateBadges, countBadgesByTier } from '../../engine/badges';
import { loadHistory } from '../../services/storage';
import { validateGoalForm } from '../../services/validation';
import { sanitizeText } from '../../services/validation';
import type { EmissionCategory, BadgeTier } from '../../types/carbon';

const TIER_LABELS: Record<BadgeTier, string> = {
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  platinum: '💎 Platinum',
};

export function Goals() {
  const { profile } = useProfile();
  const { footprint } = useEmissions();
  const { goals, addGoal, removeGoal, getGoalProgress } = useGoals();
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(10);
  const [goalCategory, setGoalCategory] = useState<EmissionCategory | 'overall'>('overall');
  const [goalMonths, setGoalMonths] = useState(6);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const history = useMemo(() => loadHistory(), []);

  const badges = useMemo(() => {
    if (!profile) return [];
    return evaluateBadges(profile, footprint, history);
  }, [profile, footprint, history]);


  const tierCounts = useMemo(() => countBadgesByTier(badges), [badges]);

  const handleCreateGoal = useCallback(() => {
    const validation = validateGoalForm({
      title: goalTitle,
      targetReductionPercent: goalTarget,
    });

    if (!validation.valid) {
      const errors: Record<string, string> = {};
      for (const err of validation.errors) {
        errors[err.field] = err.message;
      }
      setFormErrors(errors);
      return;
    }

    const baselineKgCO2 = footprint?.totalAnnualKgCO2 ?? 0;
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + goalMonths);

    addGoal({
      title: sanitizeText(goalTitle),
      targetReductionPercent: goalTarget,
      targetReductionKgCO2: (baselineKgCO2 * goalTarget) / 100,
      baselineKgCO2,
      currentKgCO2: baselineKgCO2,
      startDate: new Date().toISOString(),
      endDate: endDate.toISOString(),
      category: goalCategory,
    });

    setGoalTitle('');
    setGoalTarget(10);
    setShowNewGoal(false);
    setFormErrors({});
  }, [goalTitle, goalTarget, goalCategory, goalMonths, footprint, addGoal]);

  if (!profile || !footprint) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        Please complete onboarding first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="goals-title">
        <h2 id="goals-title" className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          🏆 Goals & Badges
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Set targets, track your progress, and earn sustainability badges.
        </p>
      </section>

      {/* Badge Showcase */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Badge Collection
          </h3>
          <div className="flex gap-3 text-sm">
            {(Object.entries(tierCounts) as [BadgeTier, number][]).map(([tier, count]) => (
              <span key={tier} className="text-slate-500 dark:text-slate-400">
                {TIER_LABELS[tier]}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {badges.map((badge) => (
            <BadgeDisplay key={badge.id} badge={badge} size="md" />
          ))}
        </div>
      </Card>

      {/* Goals Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Reduction Goals
        </h3>
        <Button
          size="sm"
          onClick={() => setShowNewGoal(!showNewGoal)}
          aria-expanded={showNewGoal}
        >
          {showNewGoal ? 'Cancel' : '+ New Goal'}
        </Button>
      </div>

      {/* New Goal Form */}
      {showNewGoal && (
        <Card variant="highlighted">
          <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Create New Goal
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Goal Title"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              placeholder="e.g. Reduce transport emissions"
              error={formErrors['Goal title']}
              required
              className="sm:col-span-2"
            />
            <Input
              label="Reduction Target (%)"
              type="number"
              value={goalTarget}
              onChange={(e) => setGoalTarget(Number(e.target.value))}
              min={1}
              max={100}
              error={formErrors['Reduction target (%)']}
              required
            />
            <Input
              label="Timeline (months)"
              type="number"
              value={goalMonths}
              onChange={(e) => setGoalMonths(Math.max(1, Number(e.target.value)))}
              min={1}
              max={36}
            />
            <Select
              label="Category"
              value={goalCategory}
              onChange={(e) => setGoalCategory(e.target.value as EmissionCategory | 'overall')}
            >
              <option value="overall">Overall</option>
              <option value="transport">Transport</option>
              <option value="electricity">Electricity</option>
              <option value="food">Food</option>
            </Select>
          </div>
          <div className="mt-4">
            <Button onClick={handleCreateGoal}>
              🎯 Create Goal
            </Button>
          </div>
        </Card>
      )}

      {/* Active Goals */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <Card variant="glass">
            <div className="text-center py-8 space-y-3">
              <span className="text-4xl" aria-hidden="true">🎯</span>
              <p className="text-slate-600 dark:text-slate-400">
                No goals yet. Set a reduction target to start tracking your progress!
              </p>
            </div>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = getGoalProgress(goal);
            const isCompleted = goal.status === 'completed';
            const isExpired = goal.status === 'expired';

            return (
              <Card
                key={goal.id}
                variant={isCompleted ? 'highlighted' : isExpired ? 'warning' : 'default'}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {goal.title}
                      </h4>
                      {isCompleted && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                          ✓ Completed
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Target: {goal.targetReductionPercent}% reduction • Category: {goal.category} •
                      Deadline: {new Date(goal.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(goal.id)}
                    aria-label={`Remove goal: ${goal.title}`}
                  >
                    ✕
                  </Button>
                </div>
                <ProgressBar
                  value={progress}
                  label={`${Math.round(progress)}% progress toward ${goal.targetReductionPercent}% reduction`}
                  size="md"
                />
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
