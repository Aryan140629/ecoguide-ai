/**
 * Scenario Simulator Feature
 *
 * Interactive "what-if" analysis letting users explore
 * hypothetical lifestyle changes and see projected savings.
 */

import { useState, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import { useProfile } from '../../hooks/useProfile';
import { simulateScenario, PRESET_SCENARIOS } from '../../engine/scenario';
import type { ScenarioChange, ScenarioResult } from '../../types/carbon';

export function Simulator() {
  const { profile } = useProfile();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customChanges, setCustomChanges] = useState<ScenarioChange[]>([]);
  const [result, setResult] = useState<ScenarioResult | null>(null);

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      if (!profile) return;
      const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
      if (!preset) return;

      setSelectedPreset(presetId);
      setCustomChanges([...preset.changes]);
      const simResult = simulateScenario(profile, preset.changes);
      setResult(simResult);
    },
    [profile]
  );

  const handleCustomSlider = useCallback(
    (field: string, category: 'transport' | 'electricity' | 'food', value: number) => {
      if (!profile) return;
      const change: ScenarioChange = {
        id: `custom-${field}`,
        category,
        description: `Custom ${field} change`,
        field,
        newValue: value,
      };

      const updated = [
        ...customChanges.filter((c) => c.field !== field),
        change,
      ];
      setCustomChanges(updated);
      setSelectedPreset(null);
      const simResult = simulateScenario(profile, updated);
      setResult(simResult);
    },
    [profile, customChanges]
  );

  const handleReset = useCallback(() => {
    setSelectedPreset(null);
    setCustomChanges([]);
    setResult(null);
  }, []);

  if (!profile) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        Please complete onboarding first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="simulator-title">
        <h2 id="simulator-title" className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          🔮 Scenario Simulator
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Explore "what if" scenarios and see projected carbon savings instantly.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Controls */}
        <div className="lg:col-span-3 space-y-6">
          {/* Preset Scenarios */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Quick Scenarios
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedPreset === preset.id
                      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800'
                  }`}
                  aria-pressed={selectedPreset === preset.id}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl" aria-hidden="true">{preset.icon}</span>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                      {preset.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Custom Sliders */}
          <Card>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Custom Adjustments
            </h3>
            <div className="space-y-6">
              {/* Reduce car distance */}
              <div>
                <label
                  htmlFor="slider-car-reduce"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  🚗 Reduce car driving by:
                  <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                    {customChanges.find((c) => c.field === 'reduceCarDistance')?.newValue as number ?? 0}%
                  </span>
                </label>
                <input
                  id="slider-car-reduce"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={(customChanges.find((c) => c.field === 'reduceCarDistance')?.newValue as number) ?? 0}
                  onChange={(e) => handleCustomSlider('reduceCarDistance', 'transport', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  aria-label="Percentage to reduce car driving"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              {/* Reduce electricity */}
              <div>
                <label
                  htmlFor="slider-elec-reduce"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  ⚡ Reduce electricity by:
                  <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                    {customChanges.find((c) => c.field === 'reducePercent')?.newValue as number ?? 0}%
                  </span>
                </label>
                <input
                  id="slider-elec-reduce"
                  type="range"
                  min={0}
                  max={50}
                  step={5}
                  value={(customChanges.find((c) => c.field === 'reducePercent')?.newValue as number) ?? 0}
                  onChange={(e) => handleCustomSlider('reducePercent', 'electricity', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  aria-label="Percentage to reduce electricity"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0%</span><span>25%</span><span>50%</span>
                </div>
              </div>

              {/* Reduce red meat */}
              <div>
                <label
                  htmlFor="slider-redmeat"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  🥩 Red meat meals per week:
                  <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                    {customChanges.find((c) => c.field === 'redMeatMealsPerWeek')?.newValue as number ?? profile.food.redMeatMealsPerWeek}
                  </span>
                </label>
                <input
                  id="slider-redmeat"
                  type="range"
                  min={0}
                  max={14}
                  step={1}
                  value={(customChanges.find((c) => c.field === 'redMeatMealsPerWeek')?.newValue as number) ?? profile.food.redMeatMealsPerWeek}
                  onChange={(e) => handleCustomSlider('redMeatMealsPerWeek', 'food', Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  aria-label="Red meat meals per week"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0</span><span>7</span><span>14</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button variant="secondary" size="sm" onClick={handleReset}>
                Reset All
              </Button>
            </div>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              <Card variant="highlighted" padding="lg">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                  Projected Impact
                </h3>
                <div className="text-center space-y-3">
                  <div>
                    <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                      {result.totalReductionKgCO2 > 0 ? '-' : ''}
                      {Math.abs(Math.round(result.totalReductionKgCO2)).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">kg CO₂/year saved</p>
                  </div>
                  <div className="w-20 h-0.5 bg-slate-200 dark:bg-slate-700 mx-auto" />
                  <div>
                    <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                      {result.totalReductionPercent > 0 ? '-' : ''}
                      {Math.abs(result.totalReductionPercent)}%
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">reduction</p>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Before vs. After
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Current</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {Math.round(result.originalFootprint.totalAnnualKgCO2).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Projected</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {Math.round(result.projectedFootprint.totalAnnualKgCO2).toLocaleString()} kg
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(5, (result.projectedFootprint.totalAnnualKgCO2 / result.originalFootprint.totalAnnualKgCO2) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Savings by Category
                </h3>
                <div className="space-y-3">
                  {[
                    { label: '🚗 Transport', value: result.changesByCategory.transport },
                    { label: '⚡ Electricity', value: result.changesByCategory.electricity },
                    { label: '🍽️ Food', value: result.changesByCategory.food },
                  ].map((cat) => (
                    <div key={cat.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{cat.label}</span>
                      <span className={`text-sm font-semibold ${cat.value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {cat.value > 0 ? `-${Math.round(cat.value).toLocaleString()} kg` : 'No change'}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card variant="glass" padding="lg">
              <div className="text-center py-8 space-y-4">
                <span className="text-5xl" aria-hidden="true">🔮</span>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Select a Scenario
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Choose a preset or adjust the sliders to see your projected carbon savings.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
