/**
 * Scenario Simulation Engine
 *
 * Allows users to explore "what-if" scenarios by modifying their
 * profile parameters and seeing projected carbon savings instantly.
 */

import type {
  UserProfile,
  ScenarioChange,
  ScenarioResult,
  TransportData,
  ElectricityData,
  FoodData,
  TransportMode,
  EnergySource,
  DietType,
} from '../types/carbon';
import { calculateTotalFootprint } from './calculator';

/**
 * Apply a set of scenario changes to a user profile and compute
 * the projected carbon footprint difference.
 */
export function simulateScenario(
  profile: UserProfile,
  changes: readonly ScenarioChange[]
): ScenarioResult {
  const originalFootprint = calculateTotalFootprint(profile);
  const modifiedProfile = applyChanges(profile, changes);
  const projectedFootprint = calculateTotalFootprint(modifiedProfile);

  const totalReductionKgCO2 = Math.round(
    (originalFootprint.totalAnnualKgCO2 - projectedFootprint.totalAnnualKgCO2) * 100
  ) / 100;

  const totalReductionPercent =
    originalFootprint.totalAnnualKgCO2 > 0
      ? Math.round(
          (totalReductionKgCO2 / originalFootprint.totalAnnualKgCO2) * 10000
        ) / 100
      : 0;

  const changesByCategory = {
    transport: Math.round(
      (originalFootprint.transport.annualKgCO2 - projectedFootprint.transport.annualKgCO2) * 100
    ) / 100,
    electricity: Math.round(
      (originalFootprint.electricity.annualKgCO2 - projectedFootprint.electricity.annualKgCO2) * 100
    ) / 100,
    food: Math.round(
      (originalFootprint.food.annualKgCO2 - projectedFootprint.food.annualKgCO2) * 100
    ) / 100,
  };

  return {
    originalFootprint,
    projectedFootprint,
    totalReductionKgCO2,
    totalReductionPercent,
    changesByCategory,
  };
}

/**
 * Apply scenario changes to create a modified profile.
 * Uses immutable update patterns.
 */
function applyChanges(
  profile: UserProfile,
  changes: readonly ScenarioChange[]
): UserProfile {
  let modified = { ...profile };

  for (const change of changes) {
    switch (change.category) {
      case 'transport':
        modified = {
          ...modified,
          transport: applyTransportChange(modified.transport, change),
        };
        break;
      case 'electricity':
        modified = {
          ...modified,
          electricity: applyElectricityChange(modified.electricity, change),
        };
        break;
      case 'food':
        modified = {
          ...modified,
          food: applyFoodChange(modified.food, change),
        };
        break;
    }
  }

  return modified;
}

type TransportStrategy = (data: TransportData, value: string | number | boolean) => TransportData;

const transportStrategies: Record<string, TransportStrategy> = {
  addMode: (data, value) => {
    const newMode = value as TransportMode;
    const existingModes = data.entries.map((e) => e.mode);
    if (existingModes.includes(newMode)) return data;
    return {
      ...data,
      entries: [...data.entries, { mode: newMode, distanceKmPerWeek: 0 }],
    };
  },
  removeMode: (data, value) => {
    const modeToRemove = value as TransportMode;
    return {
      ...data,
      entries: data.entries.filter((e) => e.mode !== modeToRemove),
    };
  },
  reduceCarDistance: (data, value) => {
    const reductionPercent = Number(value) / 100;
    return {
      ...data,
      entries: data.entries.map((e) => {
        if (
          e.mode === 'car_gasoline' ||
          e.mode === 'car_diesel' ||
          e.mode === 'car_hybrid'
        ) {
          return {
            ...e,
            distanceKmPerWeek: Math.max(0, e.distanceKmPerWeek * (1 - reductionPercent)),
          };
        }
        return e;
      }),
    };
  },
  bikeDaysPerWeek: (data, value) => {
    const bikeDays = Number(value);
    // Assume average commute distance of 10km, reduce car usage accordingly
    const bikeKmPerWeek = bikeDays * 10;
    const hasCarEntry = data.entries.some(
      (e) => e.mode === 'car_gasoline' || e.mode === 'car_diesel' || e.mode === 'car_hybrid'
    );
    const hasBikeEntry = data.entries.some((e) => e.mode === 'bicycle');

    let entries = data.entries.map((e) => {
      if (
        e.mode === 'car_gasoline' ||
        e.mode === 'car_diesel' ||
        e.mode === 'car_hybrid'
      ) {
        return {
          ...e,
          distanceKmPerWeek: Math.max(0, e.distanceKmPerWeek - bikeKmPerWeek),
        };
      }
      return e;
    });

    if (!hasBikeEntry && hasCarEntry) {
      entries = [...entries, { mode: 'bicycle' as TransportMode, distanceKmPerWeek: bikeKmPerWeek }];
    }

    return { ...data, entries };
  },
  ownsEV: (data, value) => ({ ...data, ownsEV: Boolean(value) }),
};

function applyTransportChange(data: TransportData, change: ScenarioChange): TransportData {
  const strategy = transportStrategies[change.field];
  return strategy ? strategy(data, change.newValue) : data;
}

type ElectricityStrategy = (data: ElectricityData, value: string | number | boolean) => ElectricityData;

const electricityStrategies: Record<string, ElectricityStrategy> = {
  monthlyKwh: (data, value) => ({ ...data, monthlyKwh: Math.max(0, Number(value)) }),
  reducePercent: (data, value) => {
    const reduction = Number(value) / 100;
    return { ...data, monthlyKwh: Math.max(0, data.monthlyKwh * (1 - reduction)) };
  },
  energySource: (data, value) => ({ ...data, energySource: value as EnergySource }),
  usesLEDs: (data, value) => ({ ...data, usesLEDs: Boolean(value) }),
  hasSmartThermostat: (data, value) => ({ ...data, hasSmartThermostat: Boolean(value) }),
};

function applyElectricityChange(data: ElectricityData, change: ScenarioChange): ElectricityData {
  const strategy = electricityStrategies[change.field];
  return strategy ? strategy(data, change.newValue) : data;
}

type FoodStrategy = (data: FoodData, value: string | number | boolean) => FoodData;

const foodStrategies: Record<string, FoodStrategy> = {
  dietType: (data, value) => ({ ...data, dietType: value as DietType }),
  redMeatMealsPerWeek: (data, value) => ({ ...data, redMeatMealsPerWeek: Math.max(0, Number(value)) }),
  poultryFishMealsPerWeek: (data, value) => ({ ...data, poultryFishMealsPerWeek: Math.max(0, Number(value)) }),
  prefersLocalFood: (data, value) => ({ ...data, prefersLocalFood: Boolean(value) }),
  foodWasteLevel: (data, value) => ({ ...data, foodWasteLevel: value as 'low' | 'medium' | 'high' }),
};

function applyFoodChange(data: FoodData, change: ScenarioChange): FoodData {
  const strategy = foodStrategies[change.field];
  return strategy ? strategy(data, change.newValue) : data;
}

// ─── Preset Scenarios ───────────────────────────────────────────

export interface PresetScenario {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly changes: readonly ScenarioChange[];
}

export const PRESET_SCENARIOS: readonly PresetScenario[] = [
  {
    id: 'bike-3-days',
    title: 'Bike 3 days a week',
    description: 'Replace car commutes with cycling three days per week.',
    icon: '🚲',
    changes: [
      {
        id: 'bike-change',
        category: 'transport',
        description: 'Add biking 3 days/week',
        field: 'bikeDaysPerWeek',
        newValue: 3,
      },
    ],
  },
  {
    id: 'reduce-electricity-10',
    title: 'Reduce electricity by 10%',
    description: 'Cut electricity usage by 10% through conservation habits.',
    icon: '⚡',
    changes: [
      {
        id: 'elec-reduce',
        category: 'electricity',
        description: 'Reduce electricity 10%',
        field: 'reducePercent',
        newValue: 10,
      },
    ],
  },
  {
    id: 'go-vegetarian',
    title: 'Go vegetarian',
    description: 'Switch to a fully vegetarian diet.',
    icon: '🥗',
    changes: [
      {
        id: 'diet-veg',
        category: 'food',
        description: 'Switch to vegetarian',
        field: 'dietType',
        newValue: 'vegetarian',
      },
      {
        id: 'no-red-meat',
        category: 'food',
        description: 'No red meat',
        field: 'redMeatMealsPerWeek',
        newValue: 0,
      },
    ],
  },
  {
    id: 'switch-renewable',
    title: 'Switch to renewable energy',
    description: 'Change your electricity provider to 100% renewable energy.',
    icon: '☀️',
    changes: [
      {
        id: 'renewable-switch',
        category: 'electricity',
        description: 'Switch to renewable',
        field: 'energySource',
        newValue: 'renewable',
      },
    ],
  },
  {
    id: 'full-green',
    title: 'Full green lifestyle',
    description: 'Combine biking, renewable energy, LED lighting, and low-waste diet.',
    icon: '🌍',
    changes: [
      {
        id: 'green-bike',
        category: 'transport',
        description: 'Bike 3 days/week',
        field: 'bikeDaysPerWeek',
        newValue: 3,
      },
      {
        id: 'green-renewable',
        category: 'electricity',
        description: 'Switch to renewable',
        field: 'energySource',
        newValue: 'renewable',
      },
      {
        id: 'green-led',
        category: 'electricity',
        description: 'Use LEDs',
        field: 'usesLEDs',
        newValue: true,
      },
      {
        id: 'green-waste',
        category: 'food',
        description: 'Reduce food waste',
        field: 'foodWasteLevel',
        newValue: 'low',
      },
    ],
  },
];
