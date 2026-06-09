/**
 * Onboarding Flow
 *
 * Multi-step wizard to collect user lifestyle data and build their profile.
 * 4 steps: Welcome → Transport → Energy → Food
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useProfile } from '../../hooks/useProfile';
import { sanitizeName } from '../../services/validation';
import type {
  TransportEntry,
  TransportMode,
  EnergySource,
  DietType,
  UserProfile,
} from '../../types/carbon';

const TOTAL_STEPS = 4;

const TRANSPORT_MODES: { value: TransportMode; label: string; icon: string }[] = [
  { value: 'car_gasoline', label: 'Car (Gasoline)', icon: '🚗' },
  { value: 'car_diesel', label: 'Car (Diesel)', icon: '🚙' },
  { value: 'car_hybrid', label: 'Car (Hybrid)', icon: '🔋' },
  { value: 'car_electric', label: 'Car (Electric)', icon: '⚡' },
  { value: 'bus', label: 'Bus', icon: '🚌' },
  { value: 'train', label: 'Train', icon: '🚆' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚲' },
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { value: 'airplane', label: 'Airplane', icon: '✈️' },
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [transportEntries, setTransportEntries] = useState<TransportEntry[]>([
    { mode: 'car_gasoline', distanceKmPerWeek: 100 },
  ]);
  const [ownsEV, setOwnsEV] = useState(false);
  const [monthlyKwh, setMonthlyKwh] = useState(900);
  const [energySource, setEnergySource] = useState<EnergySource>('grid_mixed');
  const [householdSize, setHouseholdSize] = useState(2);
  const [usesLEDs, setUsesLEDs] = useState(false);
  const [hasSmartThermostat, setHasSmartThermostat] = useState(false);
  const [dietType, setDietType] = useState<DietType>('average');
  const [redMeatMeals, setRedMeatMeals] = useState(3);
  const [poultryFishMeals, setPoultryFishMeals] = useState(4);
  const [prefersLocalFood, setPrefersLocalFood] = useState(false);
  const [foodWasteLevel, setFoodWasteLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const { setProfile } = useProfile();
  const navigate = useNavigate();

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const addTransportEntry = useCallback(() => {
    setTransportEntries((prev) => [
      ...prev,
      { mode: 'bus', distanceKmPerWeek: 0 },
    ]);
  }, []);

  const updateTransportEntry = useCallback(
    (index: number, field: 'mode' | 'distanceKmPerWeek', value: string | number) => {
      setTransportEntries((prev) =>
        prev.map((entry, i) => {
          if (i !== index) return entry;
          if (field === 'mode') return { ...entry, mode: value as TransportMode };
          return { ...entry, distanceKmPerWeek: Math.max(0, Number(value)) };
        })
      );
    },
    []
  );

  const removeTransportEntry = useCallback((index: number) => {
    setTransportEntries((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleComplete = useCallback(() => {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      name: sanitizeName(name) || 'User',
      createdAt: new Date().toISOString(),
      transport: {
        entries: transportEntries,
        ownsEV,
      },
      electricity: {
        monthlyKwh,
        energySource,
        householdSize,
        usesLEDs,
        hasSmartThermostat,
      },
      food: {
        dietType,
        redMeatMealsPerWeek: redMeatMeals,
        poultryFishMealsPerWeek: poultryFishMeals,
        prefersLocalFood,
        foodWasteLevel,
      },
      adoptedRecommendations: [],
      onboardingCompleted: true,
    };

    setProfile(profile);
    navigate('/dashboard');
  }, [
    name, transportEntries, ownsEV, monthlyKwh, energySource,
    householdSize, usesLEDs, hasSmartThermostat, dietType,
    redMeatMeals, poultryFishMeals, prefersLocalFood, foodWasteLevel,
    setProfile, navigate,
  ]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <ProgressBar
        value={step + 1}
        max={TOTAL_STEPS}
        label={`Step ${step + 1} of ${TOTAL_STEPS}`}
        className="mb-8"
      />

      {/* Step 0: Welcome */}
      {step === 0 && (
        <Card variant="glass" padding="lg">
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4" aria-hidden="true">🌍</div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Welcome to EcoGuide AI
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Your personal carbon coach. Let's understand your lifestyle to
              create a personalized sustainability plan.
            </p>
            <Input
              label="What should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={100}
              hint="This helps us personalize your experience"
            />
            <Button onClick={nextStep} size="lg">
              Get Started →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 1: Transport */}
      {step === 1 && (
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            🚗 Transportation
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            How do you get around? Add all your regular transport modes.
          </p>

          <div className="space-y-4">
            {transportEntries.map((entry, index) => (
              <div
                key={index}
                className="flex flex-wrap gap-3 items-end p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
              >
                <Select
                  label="Mode"
                  value={entry.mode}
                  onChange={(e) => updateTransportEntry(index, 'mode', e.target.value)}
                  className="flex-1 min-w-[180px]"
                >
                  {TRANSPORT_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>
                      {mode.icon} {mode.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="km/week"
                  type="number"
                  value={entry.distanceKmPerWeek}
                  onChange={(e) =>
                    updateTransportEntry(index, 'distanceKmPerWeek', e.target.value)
                  }
                  min={0}
                  max={5000}
                  className="w-32"
                />
                {transportEntries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTransportEntry(index)}
                    aria-label={`Remove ${entry.mode} entry`}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={addTransportEntry}
            className="mt-4"
          >
            + Add Transport Mode
          </Button>

          <label className="flex items-center gap-3 mt-6 cursor-pointer">
            <input
              type="checkbox"
              checked={ownsEV}
              onChange={(e) => setOwnsEV(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              I own an electric vehicle
            </span>
          </label>

          <div className="flex gap-3 mt-8">
            <Button variant="secondary" onClick={prevStep}>← Back</Button>
            <Button onClick={nextStep}>Continue →</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Electricity */}
      {step === 2 && (
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            ⚡ Household Energy
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Tell us about your home energy consumption.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Monthly electricity (kWh)"
              type="number"
              value={monthlyKwh}
              onChange={(e) => setMonthlyKwh(Math.max(0, Number(e.target.value)))}
              min={0}
              max={50000}
              hint="Check your electricity bill for this"
            />
            <Input
              label="Household size"
              type="number"
              value={householdSize}
              onChange={(e) => setHouseholdSize(Math.max(1, Number(e.target.value)))}
              min={1}
              max={20}
              hint="Number of people living together"
            />
            <Select
              label="Energy source"
              value={energySource}
              onChange={(e) => setEnergySource(e.target.value as EnergySource)}
              className="sm:col-span-2"
            >
              <option value="grid_mixed">Grid Mix (Default)</option>
              <option value="renewable">100% Renewable</option>
              <option value="natural_gas">Natural Gas</option>
              <option value="coal">Coal</option>
            </Select>
          </div>

          <div className="space-y-3 mt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={usesLEDs}
                onChange={(e) => setUsesLEDs(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                💡 I use LED lighting throughout my home
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasSmartThermostat}
                onChange={(e) => setHasSmartThermostat(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                🌡️ I have a smart thermostat
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="secondary" onClick={prevStep}>← Back</Button>
            <Button onClick={nextStep}>Continue →</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Food */}
      {step === 3 && (
        <Card padding="lg">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            🍽️ Food & Diet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Tell us about your eating habits.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Diet type"
              value={dietType}
              onChange={(e) => setDietType(e.target.value as DietType)}
              className="sm:col-span-2"
            >
              <option value="heavy_meat">Heavy Meat Eater</option>
              <option value="average">Average</option>
              <option value="low_meat">Low Meat</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </Select>
            <Input
              label="Red meat meals per week"
              type="number"
              value={redMeatMeals}
              onChange={(e) => setRedMeatMeals(Math.max(0, Number(e.target.value)))}
              min={0}
              max={21}
            />
            <Input
              label="Poultry/fish meals per week"
              type="number"
              value={poultryFishMeals}
              onChange={(e) => setPoultryFishMeals(Math.max(0, Number(e.target.value)))}
              min={0}
              max={21}
            />
            <Select
              label="Food waste level"
              value={foodWasteLevel}
              onChange={(e) => setFoodWasteLevel(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">Low — I rarely throw food away</option>
              <option value="medium">Medium — Some food gets wasted</option>
              <option value="high">High — I often throw food away</option>
            </Select>
          </div>

          <label className="flex items-center gap-3 mt-6 cursor-pointer">
            <input
              type="checkbox"
              checked={prefersLocalFood}
              onChange={(e) => setPrefersLocalFood(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              🌽 I prioritize locally sourced food
            </span>
          </label>

          <div className="flex gap-3 mt-8">
            <Button variant="secondary" onClick={prevStep}>← Back</Button>
            <Button onClick={handleComplete} size="lg">
              🌿 Calculate My Footprint
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
