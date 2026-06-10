/**
 * Calculator Feature
 *
 * Detailed emission input forms with real-time calculation updates.
 * Category tabs: Transport, Electricity, Food.
 */

import { useState, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Suspense, lazy } from 'react';
const EmissionChart = lazy(() =>
  import('../../components/charts/EmissionChart').then((m) => ({ default: m.EmissionChart }))
);
import { useProfile } from '../../hooks/useProfile';
import { useEmissions } from '../../hooks/useEmissions';

import type {
  TransportMode,
  TransportEntry,
  EnergySource,
  DietType,
} from '../../types/carbon';

type Tab = 'transport' | 'electricity' | 'food';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'electricity', label: 'Electricity', icon: '⚡' },
  { id: 'food', label: 'Food', icon: '🍽️' },
];

const TRANSPORT_MODES: { value: TransportMode; label: string }[] = [
  { value: 'car_gasoline', label: '🚗 Car (Gasoline)' },
  { value: 'car_diesel', label: '🚙 Car (Diesel)' },
  { value: 'car_hybrid', label: '🔋 Car (Hybrid)' },
  { value: 'car_electric', label: '⚡ Car (Electric)' },
  { value: 'bus', label: '🚌 Bus' },
  { value: 'train', label: '🚆 Train' },
  { value: 'bicycle', label: '🚲 Bicycle' },
  { value: 'walking', label: '🚶 Walking' },
  { value: 'motorcycle', label: '🏍️ Motorcycle' },
  { value: 'airplane', label: '✈️ Airplane' },
];

export function Calculator() {
  const { profile, updateTransport, updateElectricity, updateFood } = useProfile();
  const { footprint } = useEmissions();
  const [activeTab, setActiveTab] = useState<Tab>('transport');

  const handleAddTransport = useCallback(() => {
    if (!profile) return;
    const newEntry: TransportEntry = { mode: 'bus', distanceKmPerWeek: 0 };
    updateTransport({
      ...profile.transport,
      entries: [...profile.transport.entries, newEntry],
    });
  }, [profile, updateTransport]);

  const handleUpdateTransportEntry = useCallback(
    (index: number, field: 'mode' | 'distanceKmPerWeek', value: string | number) => {
      if (!profile) return;
      const entries = profile.transport.entries.map((entry, i) => {
        if (i !== index) return entry;
        if (field === 'mode') return { ...entry, mode: value as TransportMode };
        return { ...entry, distanceKmPerWeek: Math.max(0, Number(value)) };
      });
      updateTransport({ ...profile.transport, entries });
    },
    [profile, updateTransport]
  );

  const handleRemoveTransport = useCallback(
    (index: number) => {
      if (!profile) return;
      updateTransport({
        ...profile.transport,
        entries: profile.transport.entries.filter((_, i) => i !== index),
      });
    },
    [profile, updateTransport]
  );

  if (!profile) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        Please complete onboarding first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="calculator-title">
        <h2 id="calculator-title" className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
          🔢 Carbon Calculator
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Adjust your data to see real-time emission calculations.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1" role="tablist" aria-label="Emission categories">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Transport Tab */}
          {activeTab === 'transport' && (
            <Card id="tabpanel-transport" role="tabpanel" aria-labelledby="tab-transport">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Transport Modes
              </h3>
              <div className="space-y-3">
                {profile.transport.entries.map((entry, index) => (
                  <div key={index} className="flex flex-wrap gap-3 items-end p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <Select
                      label="Mode"
                      value={entry.mode}
                      onChange={(e) => handleUpdateTransportEntry(index, 'mode', e.target.value)}
                      className="flex-1 min-w-[160px]"
                      size="sm"
                    >
                      {TRANSPORT_MODES.map((m) => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </Select>
                    <Input
                      label="km/week"
                      type="number"
                      value={entry.distanceKmPerWeek}
                      onChange={(e) => handleUpdateTransportEntry(index, 'distanceKmPerWeek', e.target.value)}
                      min={0}
                      max={5000}
                      className="w-28"
                      size="sm"
                    />
                    {profile.transport.entries.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveTransport(index)} aria-label={`Remove transport entry ${index + 1}`}>
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddTransport} className="mt-3">
                + Add Mode
              </Button>
              <label className="flex items-center gap-3 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.transport.ownsEV}
                  onChange={(e) => updateTransport({ ...profile.transport, ownsEV: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">I own an EV</span>
              </label>
            </Card>
          )}

          {/* Electricity Tab */}
          {activeTab === 'electricity' && (
            <Card id="tabpanel-electricity" role="tabpanel" aria-labelledby="tab-electricity">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Household Energy
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Monthly kWh"
                  type="number"
                  value={profile.electricity.monthlyKwh}
                  onChange={(e) => updateElectricity({ ...profile.electricity, monthlyKwh: Math.max(0, Number(e.target.value)) })}
                  min={0}
                  max={50000}
                />
                <Input
                  label="Household Size"
                  type="number"
                  value={profile.electricity.householdSize}
                  onChange={(e) => updateElectricity({ ...profile.electricity, householdSize: Math.max(1, Number(e.target.value)) })}
                  min={1}
                  max={20}
                />
                <Select
                  label="Energy Source"
                  value={profile.electricity.energySource}
                  onChange={(e) => updateElectricity({ ...profile.electricity, energySource: e.target.value as EnergySource })}
                  className="sm:col-span-2"
                >
                  <option value="grid_mixed">Grid Mix</option>
                  <option value="renewable">Renewable</option>
                  <option value="natural_gas">Natural Gas</option>
                  <option value="coal">Coal</option>
                </Select>
              </div>
              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.electricity.usesLEDs}
                    onChange={(e) => updateElectricity({ ...profile.electricity, usesLEDs: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">LED Lighting</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.electricity.hasSmartThermostat}
                    onChange={(e) => updateElectricity({ ...profile.electricity, hasSmartThermostat: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Smart Thermostat</span>
                </label>
              </div>
            </Card>
          )}

          {/* Food Tab */}
          {activeTab === 'food' && (
            <Card id="tabpanel-food" role="tabpanel" aria-labelledby="tab-food">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Diet & Food
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Diet Type"
                  value={profile.food.dietType}
                  onChange={(e) => updateFood({ ...profile.food, dietType: e.target.value as DietType })}
                  className="sm:col-span-2"
                >
                  <option value="heavy_meat">Heavy Meat</option>
                  <option value="average">Average</option>
                  <option value="low_meat">Low Meat</option>
                  <option value="pescatarian">Pescatarian</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </Select>
                <Input
                  label="Red meat meals/week"
                  type="number"
                  value={profile.food.redMeatMealsPerWeek}
                  onChange={(e) => updateFood({ ...profile.food, redMeatMealsPerWeek: Math.max(0, Number(e.target.value)) })}
                  min={0}
                  max={21}
                />
                <Input
                  label="Poultry/fish meals/week"
                  type="number"
                  value={profile.food.poultryFishMealsPerWeek}
                  onChange={(e) => updateFood({ ...profile.food, poultryFishMealsPerWeek: Math.max(0, Number(e.target.value)) })}
                  min={0}
                  max={21}
                />
                <Select
                  label="Food Waste Level"
                  value={profile.food.foodWasteLevel}
                  onChange={(e) => updateFood({ ...profile.food, foodWasteLevel: e.target.value as 'low' | 'medium' | 'high' })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
              <label className="flex items-center gap-3 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.food.prefersLocalFood}
                  onChange={(e) => updateFood({ ...profile.food, prefersLocalFood: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Prefer Local Food</span>
              </label>
            </Card>
          )}
        </div>

        {/* Results Sidebar */}
        <div className="space-y-4">
          {footprint && (
            <>
              <Card variant="highlighted">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
                  Your Footprint
                </h3>
                <Suspense fallback={<div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>}>
                  <EmissionChart footprint={footprint} />
                </Suspense>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
                  Category Breakdown
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Transport', value: footprint.transport.annualKgCO2, color: 'bg-emerald-500' },
                    { label: 'Electricity', value: footprint.electricity.annualKgCO2, color: 'bg-blue-500' },
                    { label: 'Food', value: footprint.food.annualKgCO2, color: 'bg-amber-500' },
                  ].map((cat) => (
                    <div key={cat.label} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${cat.color}`} aria-hidden="true" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{cat.label}</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {Math.round(cat.value).toLocaleString()} kg
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
