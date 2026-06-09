/**
 * Recommendation Engine
 *
 * Generates personalized, prioritized action plans based on the user's
 * carbon footprint profile. Recommendations are ranked by estimated
 * CO₂ reduction impact (highest first).
 */

import type {
  CarbonFootprint,
  UserProfile,
  Recommendation,
  Difficulty,
  Timeframe,
  EmissionCategory,
} from '../types/carbon';

interface RecommendationTemplate {
  readonly id: string;
  readonly category: EmissionCategory;
  readonly action: string;
  readonly description: string;
  readonly difficulty: Difficulty;
  readonly timeframe: Timeframe;
  readonly icon: string;
  /**
   * Function to compute the estimated annual CO₂ reduction (kg)
   * based on the user's current footprint.
   */
  readonly computeReduction: (footprint: CarbonFootprint, profile: UserProfile) => number;
  /**
   * Condition under which this recommendation applies.
   * Returns false if already adopted or irrelevant.
   */
  readonly isApplicable: (profile: UserProfile) => boolean;
}

const TEMPLATES: readonly RecommendationTemplate[] = [
  // ─── Transport ──────────────────────────────────────────
  {
    id: 'transport-public-twice',
    category: 'transport',
    action: 'Switch to public transport twice weekly',
    description:
      'Replace two car commutes per week with bus or train. This can reduce your transport emissions significantly while saving on fuel costs.',
    difficulty: 'easy',
    timeframe: 'immediate',
    icon: '🚌',
    computeReduction: (footprint) => footprint.transport.annualKgCO2 * 0.18,
    isApplicable: (profile) =>
      profile.transport.entries.some(
        (e) =>
          e.mode === 'car_gasoline' ||
          e.mode === 'car_diesel' ||
          e.mode === 'car_hybrid'
      ),
  },
  {
    id: 'transport-carpool',
    category: 'transport',
    action: 'Start carpooling 3 days per week',
    description:
      'Share rides with colleagues or neighbors. Carpooling with one other person effectively halves your per-person emissions on those trips.',
    difficulty: 'moderate',
    timeframe: 'short_term',
    icon: '🚗',
    computeReduction: (footprint) => footprint.transport.annualKgCO2 * 0.15,
    isApplicable: (profile) =>
      profile.transport.entries.some(
        (e) =>
          (e.mode === 'car_gasoline' || e.mode === 'car_diesel') &&
          e.distanceKmPerWeek > 20
      ),
  },
  {
    id: 'transport-bike-commute',
    category: 'transport',
    action: 'Bike to work 2 days per week',
    description:
      'Replace short car trips with cycling. Great for distances under 10km — you\'ll also improve your fitness.',
    difficulty: 'moderate',
    timeframe: 'immediate',
    icon: '🚲',
    computeReduction: (footprint) => footprint.transport.annualKgCO2 * 0.12,
    isApplicable: (profile) =>
      profile.transport.entries.some(
        (e) =>
          (e.mode === 'car_gasoline' || e.mode === 'car_diesel' || e.mode === 'car_hybrid') &&
          e.distanceKmPerWeek > 0
      ) && !profile.transport.entries.some((e) => e.mode === 'bicycle'),
  },
  {
    id: 'transport-reduce-flights',
    category: 'transport',
    action: 'Reduce air travel by one flight per year',
    description:
      'A single round-trip domestic flight produces about 1,000 kg CO₂. Consider video calls or train alternatives.',
    difficulty: 'moderate',
    timeframe: 'long_term',
    icon: '✈️',
    computeReduction: () => 1000,
    isApplicable: (profile) =>
      profile.transport.entries.some((e) => e.mode === 'airplane' && e.distanceKmPerWeek > 0),
  },
  {
    id: 'transport-ev-switch',
    category: 'transport',
    action: 'Switch to an electric vehicle',
    description:
      'Electric vehicles produce significantly less emissions. Even on a mixed grid, EVs emit ~60% less than gasoline cars.',
    difficulty: 'challenging',
    timeframe: 'long_term',
    icon: '⚡',
    computeReduction: (footprint) => footprint.transport.annualKgCO2 * 0.45,
    isApplicable: (profile) =>
      !profile.transport.ownsEV &&
      profile.transport.entries.some(
        (e) => (e.mode === 'car_gasoline' || e.mode === 'car_diesel') && e.distanceKmPerWeek > 30
      ),
  },

  // ─── Electricity ────────────────────────────────────────
  {
    id: 'electricity-led-bulbs',
    category: 'electricity',
    action: 'Replace all bulbs with LED lighting',
    description:
      'LED bulbs use up to 80% less energy than incandescent bulbs and last 25 times longer.',
    difficulty: 'easy',
    timeframe: 'immediate',
    icon: '💡',
    computeReduction: (footprint) => footprint.electricity.annualKgCO2 * 0.07,
    isApplicable: (profile) => !profile.electricity.usesLEDs,
  },
  {
    id: 'electricity-smart-thermostat',
    category: 'electricity',
    action: 'Install a smart thermostat',
    description:
      'Smart thermostats learn your schedule and optimize heating/cooling. Average savings of 8-12% on energy bills.',
    difficulty: 'moderate',
    timeframe: 'short_term',
    icon: '🌡️',
    computeReduction: (footprint) => footprint.electricity.annualKgCO2 * 0.10,
    isApplicable: (profile) => !profile.electricity.hasSmartThermostat,
  },
  {
    id: 'electricity-reduce-10',
    category: 'electricity',
    action: 'Reduce electricity consumption by 10%',
    description:
      'Unplug devices when not in use, use power strips, and optimize appliance usage. Small habits add up to meaningful savings.',
    difficulty: 'easy',
    timeframe: 'immediate',
    icon: '🔌',
    computeReduction: (footprint) => footprint.electricity.annualKgCO2 * 0.10,
    isApplicable: (profile) => profile.electricity.monthlyKwh > 200,
  },
  {
    id: 'electricity-renewable',
    category: 'electricity',
    action: 'Switch to a renewable energy provider',
    description:
      'Green energy plans or community solar programs can reduce your electricity emissions by up to 95%.',
    difficulty: 'moderate',
    timeframe: 'short_term',
    icon: '☀️',
    computeReduction: (footprint) => footprint.electricity.annualKgCO2 * 0.80,
    isApplicable: (profile) => profile.electricity.energySource !== 'renewable',
  },

  // ─── Food ──────────────────────────────────────────────
  {
    id: 'food-reduce-red-meat',
    category: 'food',
    action: 'Reduce red meat by one meal per week',
    description:
      'Beef production is the most carbon-intensive food. Replacing one meal saves ~374 kg CO₂ per year.',
    difficulty: 'easy',
    timeframe: 'immediate',
    icon: '🥩',
    computeReduction: () => 374,
    isApplicable: (profile) => profile.food.redMeatMealsPerWeek > 1,
  },
  {
    id: 'food-meatless-day',
    category: 'food',
    action: 'Adopt one meatless day per week',
    description:
      'Going meatless one day a week can reduce your food-related emissions by ~10-15%. Try plant-based alternatives.',
    difficulty: 'easy',
    timeframe: 'immediate',
    icon: '🥬',
    computeReduction: (footprint) => footprint.food.annualKgCO2 * 0.08,
    isApplicable: (profile) =>
      profile.food.dietType !== 'vegetarian' && profile.food.dietType !== 'vegan',
  },
  {
    id: 'food-reduce-waste',
    category: 'food',
    action: 'Reduce food waste',
    description:
      'Plan meals, use leftovers, and compost. Food waste contributes to ~8% of global emissions when it decomposes in landfills.',
    difficulty: 'easy',
    timeframe: 'immediate',
    icon: '🗑️',
    computeReduction: (footprint) => footprint.food.annualKgCO2 * 0.12,
    isApplicable: (profile) =>
      profile.food.foodWasteLevel === 'high' || profile.food.foodWasteLevel === 'medium',
  },
  {
    id: 'food-buy-local',
    category: 'food',
    action: 'Buy local and seasonal produce',
    description:
      'Locally sourced food reduces transportation emissions and supports your community. Visit farmers markets and check food origin labels.',
    difficulty: 'easy',
    timeframe: 'immediate',
    icon: '🌽',
    computeReduction: (footprint) => footprint.food.annualKgCO2 * 0.05,
    isApplicable: (profile) => !profile.food.prefersLocalFood,
  },
  {
    id: 'food-go-vegetarian',
    category: 'food',
    action: 'Transition to a vegetarian diet',
    description:
      'A vegetarian diet produces about 50% less food-related emissions compared to an average diet. Start gradually with more plant-based meals.',
    difficulty: 'challenging',
    timeframe: 'long_term',
    icon: '🥗',
    computeReduction: (footprint) => footprint.food.annualKgCO2 * 0.35,
    isApplicable: (profile) =>
      profile.food.dietType === 'heavy_meat' || profile.food.dietType === 'average',
  },
];

/**
 * Generate prioritized recommendations based on the user's footprint.
 * Returns recommendations sorted by estimated CO₂ reduction (highest first).
 */
export function generateRecommendations(
  footprint: CarbonFootprint,
  profile: UserProfile
): Recommendation[] {
  const adoptedSet = new Set(profile.adoptedRecommendations);

  const recommendations: Recommendation[] = TEMPLATES
    .filter((template) => template.isApplicable(profile))
    .map((template) => {
      const reductionKg = Math.round(template.computeReduction(footprint, profile) * 100) / 100;
      const reductionPercent =
        footprint.totalAnnualKgCO2 > 0
          ? Math.round((reductionKg / footprint.totalAnnualKgCO2) * 10000) / 100
          : 0;

      return {
        id: template.id,
        category: template.category,
        action: template.action,
        description: template.description,
        estimatedReductionKgCO2: reductionKg,
        estimatedReductionPercent: reductionPercent,
        difficulty: template.difficulty,
        timeframe: template.timeframe,
        adopted: adoptedSet.has(template.id),
        icon: template.icon,
      };
    })
    // Sort by estimated reduction descending (highest impact first)
    .sort((a, b) => b.estimatedReductionKgCO2 - a.estimatedReductionKgCO2);

  return recommendations;
}

/**
 * Calculate total potential reduction if all non-adopted recommendations
 * are implemented.
 */
export function calculateTotalPotentialReduction(recommendations: Recommendation[]): {
  totalKgCO2: number;
  totalPercent: number;
} {
  const nonAdopted = recommendations.filter((r) => !r.adopted);
  const totalKgCO2 = nonAdopted.reduce((sum, r) => sum + r.estimatedReductionKgCO2, 0);
  const totalPercent = nonAdopted.reduce((sum, r) => sum + r.estimatedReductionPercent, 0);

  return {
    totalKgCO2: Math.round(totalKgCO2 * 100) / 100,
    totalPercent: Math.round(totalPercent * 100) / 100,
  };
}
