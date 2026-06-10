/**
 * Dashboard Feature
 *
 * Main dashboard displaying carbon score, emission breakdown,
 * monthly trend, top recommendations, and recent badges.
 */

import { useMemo, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BadgeDisplay } from '../../components/ui/BadgeDisplay';

const EmissionChart = lazy(() =>
  import('../../components/charts/EmissionChart').then((m) => ({ default: m.EmissionChart }))
);
const TrendChart = lazy(() =>
  import('../../components/charts/TrendChart').then((m) => ({ default: m.TrendChart }))
);
import { useProfile } from '../../hooks/useProfile';
import { useEmissions } from '../../hooks/useEmissions';
import { evaluateBadges, getEarnedBadges } from '../../engine/badges';
import { loadHistory } from '../../services/storage';
import { NATIONAL_AVERAGE_KG_CO2 } from '../../types/carbon';

export function Dashboard() {
  const { profile } = useProfile();
  const { footprint, recommendations } = useEmissions();
  const history = useMemo(() => loadHistory(), []);

  const badges = useMemo(() => {
    if (!profile) return [];
    return evaluateBadges(profile, footprint, history);
  }, [profile, footprint, history]);

  const earnedBadges = useMemo(() => getEarnedBadges(badges), [badges]);
  const topRecommendations = useMemo(() => recommendations.filter((r) => !r.adopted).slice(0, 3), [recommendations]);

  if (!profile || !footprint) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-6xl" aria-hidden="true">🌿</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Welcome to EcoGuide AI
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
          Let's start by learning about your lifestyle so we can calculate
          your carbon footprint and create a personalized action plan.
        </p>
        <Link to="/onboarding">
          <Button size="lg">🌍 Start Onboarding</Button>
        </Link>
      </div>
    );
  }

  const vsAvgPercent = Math.round((footprint.totalAnnualKgCO2 / NATIONAL_AVERAGE_KG_CO2) * 100);
  const isAboveAverage = footprint.totalAnnualKgCO2 > NATIONAL_AVERAGE_KG_CO2;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <section aria-labelledby="dashboard-title">
        <h2 id="dashboard-title" className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          Hello, {profile.name} 👋
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Here's your sustainability overview.
        </p>
      </section>

      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Carbon Score */}
        <Card variant={isAboveAverage ? 'warning' : 'highlighted'} padding="md">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Annual Footprint</p>
          <p className="text-3xl font-bold mt-1 text-slate-800 dark:text-slate-100">
            {Math.round(footprint.totalAnnualKgCO2).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">kg CO₂/year</p>
        </Card>

        {/* vs National Average */}
        <Card padding="md">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">vs. National Average</p>
          <p className={`text-3xl font-bold mt-1 ${isAboveAverage ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {vsAvgPercent}%
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAboveAverage ? 'Above average' : 'Below average'} ({NATIONAL_AVERAGE_KG_CO2.toLocaleString()} kg)
          </p>
        </Card>

        {/* Top Category */}
        <Card padding="md">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Highest Impact</p>
          <p className="text-3xl font-bold mt-1 text-slate-800 dark:text-slate-100">
            {getTopCategory(footprint.percentages)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {Math.round(Math.max(footprint.percentages.transport, footprint.percentages.electricity, footprint.percentages.food))}% of total
          </p>
        </Card>

        {/* Badges */}
        <Card padding="md">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Badges Earned</p>
          <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {earnedBadges.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            of {badges.length} available
          </p>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Emission Breakdown
          </h3>
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>}>
            <EmissionChart footprint={footprint} />
          </Suspense>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Monthly Trend
          </h3>
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>}>
            <TrendChart history={history} />
          </Suspense>
        </Card>
      </div>

      {/* Recommendations Preview */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            🎯 Top Impact Actions
          </h3>
          <Link to="/coach">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>
        {topRecommendations.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            Great job! You've adopted all recommendations.
          </p>
        ) : (
          <div className="space-y-3">
            {topRecommendations.map((rec, i) => (
              <div
                key={rec.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="text-2xl mt-0.5 flex-shrink-0" aria-hidden="true">
                  {rec.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      #{i + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {rec.action}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {rec.description.slice(0, 80)}…
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    -{rec.estimatedReductionPercent}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {Math.round(rec.estimatedReductionKgCO2).toLocaleString()} kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Badges Row */}
      {earnedBadges.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              🏆 Recent Badges
            </h3>
            <Link to="/goals">
              <Button variant="ghost" size="sm">View all →</Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-6">
            {earnedBadges.slice(0, 6).map((badge) => (
              <BadgeDisplay key={badge.id} badge={badge} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function getTopCategory(percentages: Record<string, number>): string {
  const categories = [
    { name: 'Transport', value: percentages.transport ?? 0 },
    { name: 'Electricity', value: percentages.electricity ?? 0 },
    { name: 'Food', value: percentages.food ?? 0 },
  ];
  categories.sort((a, b) => b.value - a.value);
  return categories[0]?.name ?? 'N/A';
}
