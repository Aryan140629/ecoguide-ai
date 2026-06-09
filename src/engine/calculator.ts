/**
 * Carbon Emission Calculator Engine
 *
 * Pure functions for computing CO₂ equivalent emissions across
 * transport, electricity, and food categories. All calculations
 * use emission factors from EPA and IPCC published data.
 */

import type {
  TransportData,
  ElectricityData,
  FoodData,
  EmissionResult,
  EmissionBreakdownItem,
  CarbonFootprint,
  UserProfile,
} from '../types/carbon';

import {
  TRANSPORT_EMISSION_FACTORS,
  ELECTRICITY_EMISSION_FACTORS,
  DIET_EMISSION_FACTORS,
  RED_MEAT_PER_MEAL_KG_CO2,
  POULTRY_FISH_PER_MEAL_KG_CO2,
  FOOD_WASTE_MULTIPLIERS,
  LOCAL_FOOD_REDUCTION,
  NATIONAL_AVERAGE_KG_CO2,
} from '../types/carbon';

const WEEKS_PER_YEAR = 52;

/**
 * Clamp a numeric value to a non-negative range.
 * Defensive against invalid inputs.
 */
function clampNonNegative(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

/**
 * Calculate annual CO₂ emissions from transportation.
 */
export function calculateTransportEmissions(data: TransportData): EmissionResult {
  const breakdown: EmissionBreakdownItem[] = [];
  let totalAnnual = 0;

  for (const entry of data.entries) {
    const distance = clampNonNegative(entry.distanceKmPerWeek);
    const factor = TRANSPORT_EMISSION_FACTORS[entry.mode];
    const annualKg = distance * factor * WEEKS_PER_YEAR;

    if (annualKg > 0) {
      breakdown.push({
        label: formatTransportMode(entry.mode),
        annualKgCO2: Math.round(annualKg * 100) / 100,
        percentage: 0, // calculated below
      });
    }

    totalAnnual += annualKg;
  }

  totalAnnual = Math.round(totalAnnual * 100) / 100;

  // Calculate percentages
  const finalBreakdown: EmissionBreakdownItem[] = breakdown.map((item) => ({
    ...item,
    percentage: totalAnnual > 0 ? Math.round((item.annualKgCO2 / totalAnnual) * 10000) / 100 : 0,
  }));

  return {
    annualKgCO2: totalAnnual,
    category: 'transport',
    breakdown: finalBreakdown,
  };
}

/**
 * Calculate annual CO₂ emissions from household electricity.
 */
export function calculateElectricityEmissions(data: ElectricityData): EmissionResult {
  const monthlyKwh = clampNonNegative(data.monthlyKwh);
  const householdSize = Math.max(1, clampNonNegative(data.householdSize));
  const factor = ELECTRICITY_EMISSION_FACTORS[data.energySource];

  // Per-capita annual consumption
  const annualKwh = (monthlyKwh * 12) / householdSize;
  let annualKgCO2 = annualKwh * factor;

  const breakdown: EmissionBreakdownItem[] = [];

  const baseEmission = annualKgCO2;
  breakdown.push({
    label: `Electricity (${formatEnergySource(data.energySource)})`,
    annualKgCO2: Math.round(baseEmission * 100) / 100,
    percentage: 100,
  });

  // LED lighting savings (estimated 5% reduction)
  if (data.usesLEDs) {
    const ledSavings = annualKgCO2 * 0.05;
    annualKgCO2 -= ledSavings;
    breakdown.push({
      label: 'LED lighting savings',
      annualKgCO2: -Math.round(ledSavings * 100) / 100,
      percentage: 0,
    });
  }

  // Smart thermostat savings (estimated 8% reduction)
  if (data.hasSmartThermostat) {
    const thermostatSavings = annualKgCO2 * 0.08;
    annualKgCO2 -= thermostatSavings;
    breakdown.push({
      label: 'Smart thermostat savings',
      annualKgCO2: -Math.round(thermostatSavings * 100) / 100,
      percentage: 0,
    });
  }

  annualKgCO2 = Math.round(Math.max(0, annualKgCO2) * 100) / 100;

  // Recalculate percentages
  const finalBreakdown: EmissionBreakdownItem[] = breakdown.map((item) => ({
    ...item,
    percentage:
      annualKgCO2 > 0
        ? Math.round((Math.abs(item.annualKgCO2) / annualKgCO2) * 10000) / 100
        : 0,
  }));

  return {
    annualKgCO2,
    category: 'electricity',
    breakdown: finalBreakdown,
  };
}

/**
 * Calculate annual CO₂ emissions from food consumption.
 */
export function calculateFoodEmissions(data: FoodData): EmissionResult {
  const breakdown: EmissionBreakdownItem[] = [];

  // Base diet emissions
  let annualKgCO2 = DIET_EMISSION_FACTORS[data.dietType];
  breakdown.push({
    label: `${formatDietType(data.dietType)} diet baseline`,
    annualKgCO2,
    percentage: 0,
  });

  // Additional red meat emissions
  const redMeatWeekly = clampNonNegative(data.redMeatMealsPerWeek);
  const redMeatAnnual = redMeatWeekly * RED_MEAT_PER_MEAL_KG_CO2 * WEEKS_PER_YEAR;
  if (redMeatAnnual > 0) {
    annualKgCO2 += redMeatAnnual;
    breakdown.push({
      label: 'Red meat consumption',
      annualKgCO2: Math.round(redMeatAnnual * 100) / 100,
      percentage: 0,
    });
  }

  // Additional poultry/fish emissions
  const poultryWeekly = clampNonNegative(data.poultryFishMealsPerWeek);
  const poultryAnnual = poultryWeekly * POULTRY_FISH_PER_MEAL_KG_CO2 * WEEKS_PER_YEAR;
  if (poultryAnnual > 0) {
    annualKgCO2 += poultryAnnual;
    breakdown.push({
      label: 'Poultry & fish consumption',
      annualKgCO2: Math.round(poultryAnnual * 100) / 100,
      percentage: 0,
    });
  }

  // Food waste multiplier
  const wasteMultiplier = FOOD_WASTE_MULTIPLIERS[data.foodWasteLevel];
  if (wasteMultiplier > 1) {
    const wasteEmissions = annualKgCO2 * (wasteMultiplier - 1);
    annualKgCO2 *= wasteMultiplier;
    breakdown.push({
      label: `Food waste (${data.foodWasteLevel})`,
      annualKgCO2: Math.round(wasteEmissions * 100) / 100,
      percentage: 0,
    });
  }

  // Local food reduction
  if (data.prefersLocalFood) {
    const localSavings = annualKgCO2 * LOCAL_FOOD_REDUCTION;
    annualKgCO2 -= localSavings;
    breakdown.push({
      label: 'Local food preference savings',
      annualKgCO2: -Math.round(localSavings * 100) / 100,
      percentage: 0,
    });
  }

  annualKgCO2 = Math.round(Math.max(0, annualKgCO2) * 100) / 100;

  // Recalculate percentages
  const positiveTotal = breakdown
    .filter((b) => b.annualKgCO2 > 0)
    .reduce((sum, b) => sum + b.annualKgCO2, 0);
  const finalBreakdown: EmissionBreakdownItem[] = breakdown.map((item) => ({
    ...item,
    percentage:
      positiveTotal > 0
        ? Math.round((Math.abs(item.annualKgCO2) / positiveTotal) * 10000) / 100
        : 0,
  }));

  return {
    annualKgCO2,
    category: 'food',
    breakdown: finalBreakdown,
  };
}

/**
 * Calculate complete carbon footprint from user profile.
 */
export function calculateTotalFootprint(profile: UserProfile): CarbonFootprint {
  const transport = calculateTransportEmissions(profile.transport);
  const electricity = calculateElectricityEmissions(profile.electricity);
  const food = calculateFoodEmissions(profile.food);

  const total = Math.round((transport.annualKgCO2 + electricity.annualKgCO2 + food.annualKgCO2) * 100) / 100;

  const percentages = {
    transport: total > 0 ? Math.round((transport.annualKgCO2 / total) * 10000) / 100 : 0,
    electricity: total > 0 ? Math.round((electricity.annualKgCO2 / total) * 10000) / 100 : 0,
    food: total > 0 ? Math.round((food.annualKgCO2 / total) * 10000) / 100 : 0,
  };

  return {
    transport,
    electricity,
    food,
    totalAnnualKgCO2: total,
    percentages,
    vsNationalAverage: total > 0 ? Math.round((total / NATIONAL_AVERAGE_KG_CO2) * 100) / 100 : 0,
    calculatedAt: new Date().toISOString(),
  };
}

// ─── Formatters ─────────────────────────────────────────────────

function formatTransportMode(mode: string): string {
  const labels: Record<string, string> = {
    car_gasoline: 'Car (Gasoline)',
    car_diesel: 'Car (Diesel)',
    car_hybrid: 'Car (Hybrid)',
    car_electric: 'Car (Electric)',
    bus: 'Bus',
    train: 'Train',
    bicycle: 'Bicycle',
    walking: 'Walking',
    motorcycle: 'Motorcycle',
    airplane: 'Airplane',
  };
  return labels[mode] ?? mode;
}

function formatEnergySource(source: string): string {
  const labels: Record<string, string> = {
    grid_mixed: 'Grid Mix',
    renewable: 'Renewable',
    coal: 'Coal',
    natural_gas: 'Natural Gas',
  };
  return labels[source] ?? source;
}

function formatDietType(diet: string): string {
  const labels: Record<string, string> = {
    heavy_meat: 'Heavy Meat',
    average: 'Average',
    low_meat: 'Low Meat',
    pescatarian: 'Pescatarian',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
  };
  return labels[diet] ?? diet;
}
