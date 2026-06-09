/**
 * Badge Evaluation Engine
 *
 * Determines which sustainability badges a user has earned
 * based on their profile, footprint, and emission history.
 */

import type { Badge, BadgeTier, BadgeCategory, UserProfile, EmissionSnapshot, CarbonFootprint } from '../types/carbon';
import { NATIONAL_AVERAGE_KG_CO2 } from '../types/carbon';

interface BadgeDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: BadgeCategory;
  readonly tier: BadgeTier;
  readonly icon: string;
  readonly requirement: string;
  readonly evaluate: (
    profile: UserProfile,
    footprint: CarbonFootprint | null,
    history: readonly EmissionSnapshot[]
  ) => boolean;
}

const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  // ─── Overall ────────────────────────────────────────────
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Complete the onboarding and calculate your first carbon footprint.',
    category: 'overall',
    tier: 'bronze',
    icon: '🌱',
    requirement: 'Complete onboarding',
    evaluate: (profile) => profile.onboardingCompleted,
  },
  {
    id: 'below-average',
    name: 'Below Average',
    description: 'Your carbon footprint is below the national average.',
    category: 'overall',
    tier: 'silver',
    icon: '📉',
    requirement: 'Footprint below national average',
    evaluate: (_profile, footprint) =>
      footprint !== null && footprint.totalAnnualKgCO2 < NATIONAL_AVERAGE_KG_CO2,
  },
  {
    id: 'half-footprint',
    name: 'Half & Half',
    description: 'Reduce your footprint to half the national average.',
    category: 'overall',
    tier: 'gold',
    icon: '🏆',
    requirement: 'Footprint below 50% of national average',
    evaluate: (_profile, footprint) =>
      footprint !== null && footprint.totalAnnualKgCO2 < NATIONAL_AVERAGE_KG_CO2 / 2,
  },
  {
    id: 'climate-champion',
    name: 'Climate Champion',
    description: 'Achieve a footprint below 25% of the national average.',
    category: 'overall',
    tier: 'platinum',
    icon: '🌟',
    requirement: 'Footprint below 25% of national average',
    evaluate: (_profile, footprint) =>
      footprint !== null && footprint.totalAnnualKgCO2 < NATIONAL_AVERAGE_KG_CO2 / 4,
  },

  // ─── Transport ──────────────────────────────────────────
  {
    id: 'green-commuter',
    name: 'Green Commuter',
    description: 'Use public transport, biking, or walking as your primary commute.',
    category: 'transport',
    tier: 'bronze',
    icon: '🚌',
    requirement: 'Primary transport is green',
    evaluate: (profile) => {
      const greenModes = ['bus', 'train', 'bicycle', 'walking'];
      const greenDistance = profile.transport.entries
        .filter((e) => greenModes.includes(e.mode))
        .reduce((sum, e) => sum + e.distanceKmPerWeek, 0);
      const totalDistance = profile.transport.entries.reduce(
        (sum, e) => sum + e.distanceKmPerWeek,
        0
      );
      return totalDistance > 0 && greenDistance / totalDistance > 0.5;
    },
  },
  {
    id: 'ev-pioneer',
    name: 'EV Pioneer',
    description: 'Own and drive an electric vehicle.',
    category: 'transport',
    tier: 'silver',
    icon: '⚡',
    requirement: 'Own an electric vehicle',
    evaluate: (profile) => profile.transport.ownsEV,
  },

  // ─── Energy ─────────────────────────────────────────────
  {
    id: 'led-hero',
    name: 'LED Hero',
    description: 'Switch all your lighting to energy-efficient LEDs.',
    category: 'energy',
    tier: 'bronze',
    icon: '💡',
    requirement: 'Use LED lighting',
    evaluate: (profile) => profile.electricity.usesLEDs,
  },
  {
    id: 'smart-home',
    name: 'Smart Home',
    description: 'Use a smart thermostat to optimize energy consumption.',
    category: 'energy',
    tier: 'bronze',
    icon: '🌡️',
    requirement: 'Have smart thermostat',
    evaluate: (profile) => profile.electricity.hasSmartThermostat,
  },
  {
    id: 'renewable-warrior',
    name: 'Renewable Warrior',
    description: 'Power your home with 100% renewable energy.',
    category: 'energy',
    tier: 'gold',
    icon: '☀️',
    requirement: 'Use renewable energy source',
    evaluate: (profile) => profile.electricity.energySource === 'renewable',
  },

  // ─── Food ──────────────────────────────────────────────
  {
    id: 'waste-reducer',
    name: 'Waste Reducer',
    description: 'Keep your food waste at a low level.',
    category: 'food',
    tier: 'bronze',
    icon: '♻️',
    requirement: 'Low food waste level',
    evaluate: (profile) => profile.food.foodWasteLevel === 'low',
  },
  {
    id: 'local-champion',
    name: 'Local Champion',
    description: 'Prioritize locally sourced food.',
    category: 'food',
    tier: 'bronze',
    icon: '🌽',
    requirement: 'Prefer local food',
    evaluate: (profile) => profile.food.prefersLocalFood,
  },
  {
    id: 'plant-powered',
    name: 'Plant Powered',
    description: 'Follow a vegetarian or vegan diet.',
    category: 'food',
    tier: 'gold',
    icon: '🌿',
    requirement: 'Vegetarian or vegan diet',
    evaluate: (profile) =>
      profile.food.dietType === 'vegetarian' || profile.food.dietType === 'vegan',
  },

  // ─── Streak ─────────────────────────────────────────────
  {
    id: 'action-taker',
    name: 'Action Taker',
    description: 'Adopt at least 3 recommendations.',
    category: 'streak',
    tier: 'bronze',
    icon: '🎯',
    requirement: 'Adopt 3+ recommendations',
    evaluate: (profile) => profile.adoptedRecommendations.length >= 3,
  },
  {
    id: 'eco-warrior',
    name: 'Eco Warrior',
    description: 'Adopt at least 7 recommendations.',
    category: 'streak',
    tier: 'silver',
    icon: '⭐',
    requirement: 'Adopt 7+ recommendations',
    evaluate: (profile) => profile.adoptedRecommendations.length >= 7,
  },
  {
    id: 'sustainability-master',
    name: 'Sustainability Master',
    description: 'Adopt at least 12 recommendations and achieve below-average footprint.',
    category: 'streak',
    tier: 'platinum',
    icon: '👑',
    requirement: 'Adopt 12+ recommendations & below-average footprint',
    evaluate: (profile, footprint) =>
      profile.adoptedRecommendations.length >= 12 &&
      footprint !== null &&
      footprint.totalAnnualKgCO2 < NATIONAL_AVERAGE_KG_CO2,
  },
];

/**
 * Evaluate all badges for a user and return them with earned status.
 */
export function evaluateBadges(
  profile: UserProfile,
  footprint: CarbonFootprint | null,
  history: readonly EmissionSnapshot[]
): Badge[] {
  return BADGE_DEFINITIONS.map((def) => {
    const earned = def.evaluate(profile, footprint, history);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      tier: def.tier,
      icon: def.icon,
      requirement: def.requirement,
      earnedAt: earned ? new Date().toISOString() : null,
    };
  });
}

/**
 * Get only the earned badges.
 */
export function getEarnedBadges(badges: readonly Badge[]): Badge[] {
  return badges.filter((b) => b.earnedAt !== null);
}

/**
 * Count badges by tier.
 */
export function countBadgesByTier(badges: readonly Badge[]): Record<BadgeTier, number> {
  const earned = getEarnedBadges(badges);
  return {
    bronze: earned.filter((b) => b.tier === 'bronze').length,
    silver: earned.filter((b) => b.tier === 'silver').length,
    gold: earned.filter((b) => b.tier === 'gold').length,
    platinum: earned.filter((b) => b.tier === 'platinum').length,
  };
}
