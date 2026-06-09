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

function applyTransportChange(data: TransportData, change: ScenarioChange): TransportData {
  switch (change.field) {
    case 'addMode': {
      const newMode = change.newValue as TransportMode;
      const existingModes = data.entries.map((e) => e.mode);
      if (existingModes.includes(newMode)) return data;
      return {
        ...data,
        entries: [...data.entries, { mode: newMode, distanceKmPerWeek: 0 }],
      };
    }
    case 'removeMode': {
      const modeToRemove = change.newValue as TransportMode;
      return {
        ...data,
        entries: data.entries.filter((e) => e.mode !== modeToRemove),
      };
    }
    case 'reduceCarDistance': {
      const reductionPercent = Number(change.newValue) / 100;
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
    }
    case 'bikeDaysPerWeek': {
      const bikeDays = Number(change.newValue);
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
    }
    case 'ownsEV':
      return { ...data, ownsEV: Boolean(change.newValue) };
    default:
      return data;
  }
}

function applyElectricityChange(data: ElectricityData, change: ScenarioChange): ElectricityData {
  switch (change.field) {
    case 'monthlyKwh':
      return { ...data, monthlyKwh: Math.max(0, Number(change.newValue)) };
    case 'reducePercent': {
      const reduction = Number(change.newValue) / 100;
      return { ...data, monthlyKwh: Math.max(0, data.monthlyKwh * (1 - reduction)) };
    }
    case 'energySource':
      return { ...data, energySource: change.newValue as EnergySource };
    case 'usesLEDs':
      return { ...data, usesLEDs: Boolean(change.newValue) };
    case 'hasSmartThermostat':
      return { ...data, hasSmartThermostat: Boolean(change.newValue) };
    default:
      return data;
  }
}

function applyFoodChange(data: FoodData, change: ScenarioChange): FoodData {
  switch (change.field) {
    case 'dietType':
      return { ...data, dietType: change.newValue as DietType };
    case 'redMeatMealsPerWeek':
      return { ...data, redMeatMealsPerWeek: Math.max(0, Number(change.newValue)) };
    case 'poultryFishMealsPerWeek':
      return { ...data, poultryFishMealsPerWeek: Math.max(0, Number(change.newValue)) };
    case 'prefersLocalFood':
      return { ...data, prefersLocalFood: Boolean(change.newValue) };
    case 'foodWasteLevel':
      return { ...data, foodWasteLevel: change.newValue as 'low' | 'medium' | 'high' };
    default:
      return data;
  }
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
