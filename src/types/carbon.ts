/**
 * EcoGuide AI — Domain Type System
 *
 * All types for carbon footprint tracking, recommendations,
 * scenarios, badges, and user profiles. Strict TypeScript with
 * discriminated unions where applicable.
 */

// ─── Emission Categories ────────────────────────────────────────

export type EmissionCategory = 'transport' | 'electricity' | 'food';

// ─── Transport ──────────────────────────────────────────────────

export type TransportMode =
  | 'car_gasoline'
  | 'car_diesel'
  | 'car_hybrid'
  | 'car_electric'
  | 'bus'
  | 'train'
  | 'bicycle'
  | 'walking'
  | 'motorcycle'
  | 'airplane';

export interface TransportEntry {
  readonly mode: TransportMode;
  /** Distance in kilometers per week */
  readonly distanceKmPerWeek: number;
}

export interface TransportData {
  readonly entries: readonly TransportEntry[];
  /** Whether the user owns an electric vehicle */
  readonly ownsEV: boolean;
}

// ─── Electricity ────────────────────────────────────────────────

export type EnergySource = 'grid_mixed' | 'renewable' | 'coal' | 'natural_gas';

export interface ElectricityData {
  /** Monthly electricity consumption in kWh */
  readonly monthlyKwh: number;
  /** Primary energy source */
  readonly energySource: EnergySource;
  /** Number of people in the household */
  readonly householdSize: number;
  /** Whether user uses LED lighting */
  readonly usesLEDs: boolean;
  /** Whether user has smart thermostat */
  readonly hasSmartThermostat: boolean;
}

// ─── Food ───────────────────────────────────────────────────────

export type DietType = 'heavy_meat' | 'average' | 'low_meat' | 'pescatarian' | 'vegetarian' | 'vegan';

export interface FoodData {
  readonly dietType: DietType;
  /** Meals of red meat per week */
  readonly redMeatMealsPerWeek: number;
  /** Meals of poultry/fish per week */
  readonly poultryFishMealsPerWeek: number;
  /** Whether user prioritizes local food */
  readonly prefersLocalFood: boolean;
  /** Amount of food waste (low / medium / high) */
  readonly foodWasteLevel: 'low' | 'medium' | 'high';
}

// ─── Emission Results ───────────────────────────────────────────

export interface EmissionResult {
  /** CO₂ equivalent in kg per year */
  readonly annualKgCO2: number;
  /** The category of this emission */
  readonly category: EmissionCategory;
  /** Breakdown details for display */
  readonly breakdown: readonly EmissionBreakdownItem[];
}

export interface EmissionBreakdownItem {
  readonly label: string;
  readonly annualKgCO2: number;
  readonly percentage: number;
}

export interface CarbonFootprint {
  readonly transport: EmissionResult;
  readonly electricity: EmissionResult;
  readonly food: EmissionResult;
  readonly totalAnnualKgCO2: number;
  /** Percentage breakdown by category */
  readonly percentages: Record<EmissionCategory, number>;
  /** Comparison to national average (ratio) */
  readonly vsNationalAverage: number;
  readonly calculatedAt: string;
}

// ─── Recommendations ────────────────────────────────────────────

export type Difficulty = 'easy' | 'moderate' | 'challenging';
export type Timeframe = 'immediate' | 'short_term' | 'long_term';

export interface Recommendation {
  readonly id: string;
  readonly category: EmissionCategory;
  readonly action: string;
  readonly description: string;
  /** Estimated annual CO₂ reduction in kg */
  readonly estimatedReductionKgCO2: number;
  /** Estimated percentage reduction of total footprint */
  readonly estimatedReductionPercent: number;
  readonly difficulty: Difficulty;
  readonly timeframe: Timeframe;
  /** Whether the user has adopted this recommendation */
  readonly adopted: boolean;
  /** Icon identifier for the UI */
  readonly icon: string;
}

// ─── Scenarios ──────────────────────────────────────────────────

export interface ScenarioChange {
  readonly id: string;
  readonly category: EmissionCategory;
  readonly description: string;
  /** The field path being modified */
  readonly field: string;
  /** The new value for the field */
  readonly newValue: number | string | boolean;
}

export interface ScenarioResult {
  readonly originalFootprint: CarbonFootprint;
  readonly projectedFootprint: CarbonFootprint;
  readonly totalReductionKgCO2: number;
  readonly totalReductionPercent: number;
  readonly changesByCategory: Record<EmissionCategory, number>;
}

// ─── Badges ─────────────────────────────────────────────────────

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type BadgeCategory = 'transport' | 'energy' | 'food' | 'overall' | 'streak';

export interface Badge {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: BadgeCategory;
  readonly tier: BadgeTier;
  readonly icon: string;
  readonly earnedAt: string | null;
  readonly requirement: string;
}

// ─── Goals ──────────────────────────────────────────────────────

export type GoalStatus = 'active' | 'completed' | 'expired';

export interface Goal {
  readonly id: string;
  readonly title: string;
  readonly targetReductionPercent: number;
  readonly targetReductionKgCO2: number;
  readonly baselineKgCO2: number;
  readonly currentKgCO2: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly status: GoalStatus;
  readonly category: EmissionCategory | 'overall';
}

// ─── User Profile ───────────────────────────────────────────────

export interface UserProfile {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly transport: TransportData;
  readonly electricity: ElectricityData;
  readonly food: FoodData;
  readonly adoptedRecommendations: readonly string[];
  readonly onboardingCompleted: boolean;
}

// ─── Emission History ───────────────────────────────────────────

export interface EmissionSnapshot {
  readonly date: string;
  readonly totalAnnualKgCO2: number;
  readonly transport: number;
  readonly electricity: number;
  readonly food: number;
}

// ─── App State ──────────────────────────────────────────────────

export interface AppState {
  readonly profile: UserProfile | null;
  readonly footprint: CarbonFootprint | null;
  readonly goals: readonly Goal[];
  readonly history: readonly EmissionSnapshot[];
  readonly badges: readonly Badge[];
}

// ─── Validation ─────────────────────────────────────────────────

export interface ValidationError {
  readonly field: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

// ─── Constants ──────────────────────────────────────────────────

/** US national average CO₂ emissions per capita (kg/year) — EPA 2023 */
export const NATIONAL_AVERAGE_KG_CO2 = 16000;

/** Emission factors for transport modes (kg CO₂ per km) */
export const TRANSPORT_EMISSION_FACTORS: Record<TransportMode, number> = {
  car_gasoline: 0.21,
  car_diesel: 0.27,
  car_hybrid: 0.12,
  car_electric: 0.05,
  bus: 0.089,
  train: 0.041,
  bicycle: 0,
  walking: 0,
  motorcycle: 0.113,
  airplane: 0.255,
} as const;

/** Emission factors for electricity sources (kg CO₂ per kWh) */
export const ELECTRICITY_EMISSION_FACTORS: Record<EnergySource, number> = {
  grid_mixed: 0.417,
  renewable: 0.02,
  coal: 0.91,
  natural_gas: 0.55,
} as const;

/** Annual food emissions by diet type (kg CO₂/year) */
export const DIET_EMISSION_FACTORS: Record<DietType, number> = {
  heavy_meat: 3300,
  average: 2500,
  low_meat: 1900,
  pescatarian: 1700,
  vegetarian: 1500,
  vegan: 1100,
} as const;

/** Additional red meat emission per meal (kg CO₂) */
export const RED_MEAT_PER_MEAL_KG_CO2 = 7.2;

/** Additional poultry/fish emission per meal (kg CO₂) */
export const POULTRY_FISH_PER_MEAL_KG_CO2 = 1.8;

/** Food waste multiplier */
export const FOOD_WASTE_MULTIPLIERS: Record<'low' | 'medium' | 'high', number> = {
  low: 1.0,
  medium: 1.12,
  high: 1.25,
} as const;

/** Local food reduction factor */
export const LOCAL_FOOD_REDUCTION = 0.05;
