/**
 * Emissions Hook
 *
 * Memoized carbon footprint calculations that only
 * recompute when the user profile changes.
 */

import { useMemo } from 'react';
import type { CarbonFootprint, Recommendation } from '../types/carbon';
import { calculateTotalFootprint } from '../engine/calculator';
import { generateRecommendations } from '../engine/recommendations';
import { useProfile } from './useProfile';

interface EmissionsData {
  footprint: CarbonFootprint | null;
  recommendations: Recommendation[];
  isCalculated: boolean;
}

export function useEmissions(): EmissionsData {
  const { profile } = useProfile();

  const footprint = useMemo<CarbonFootprint | null>(() => {
    if (!profile || !profile.onboardingCompleted) return null;
    return calculateTotalFootprint(profile);
  }, [profile]);

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!footprint || !profile) return [];
    return generateRecommendations(footprint, profile);
  }, [footprint, profile]);

  return {
    footprint,
    recommendations,
    isCalculated: footprint !== null,
  };
}
