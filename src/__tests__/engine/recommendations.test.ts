/**
 * Recommendation Engine Tests
 *
 * Tests for recommendation generation, prioritization,
 * filtering, and potential reduction calculations.
 */

import { describe, it, expect } from 'vitest';
import { generateRecommendations, calculateTotalPotentialReduction } from '../../engine/recommendations';
import { calculateTotalFootprint } from '../../engine/calculator';
import type { UserProfile } from '../../types/carbon';

const createProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'test-123',
  name: 'Test User',
  createdAt: '2024-01-01',
  transport: {
    entries: [{ mode: 'car_gasoline', distanceKmPerWeek: 150 }],
    ownsEV: false,
  },
  electricity: {
    monthlyKwh: 900,
    energySource: 'grid_mixed',
    householdSize: 2,
    usesLEDs: false,
    hasSmartThermostat: false,
  },
  food: {
    dietType: 'average',
    redMeatMealsPerWeek: 4,
    poultryFishMealsPerWeek: 3,
    prefersLocalFood: false,
    foodWasteLevel: 'medium',
  },
  adoptedRecommendations: [],
  onboardingCompleted: true,
  ...overrides,
});

describe('generateRecommendations', () => {
  it('generates recommendations for a typical profile', () => {
    const profile = createProfile();
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);

    expect(recs.length).toBeGreaterThan(0);
  });

  it('sorts recommendations by estimated reduction descending', () => {
    const profile = createProfile();
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);

    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].estimatedReductionKgCO2).toBeGreaterThanOrEqual(
        recs[i].estimatedReductionKgCO2
      );
    }
  });

  it('each recommendation has all required fields', () => {
    const profile = createProfile();
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);

    for (const rec of recs) {
      expect(rec.id).toBeTruthy();
      expect(rec.action).toBeTruthy();
      expect(rec.description).toBeTruthy();
      expect(rec.category).toMatch(/^(transport|electricity|food)$/);
      expect(rec.difficulty).toMatch(/^(easy|moderate|challenging)$/);
      expect(rec.timeframe).toMatch(/^(immediate|short_term|long_term)$/);
      expect(rec.estimatedReductionKgCO2).toBeGreaterThanOrEqual(0);
      expect(rec.estimatedReductionPercent).toBeGreaterThanOrEqual(0);
      expect(typeof rec.adopted).toBe('boolean');
    }
  });

  it('filters out LED recommendation when user already uses LEDs', () => {
    const profile = createProfile({
      electricity: {
        monthlyKwh: 900,
        energySource: 'grid_mixed',
        householdSize: 2,
        usesLEDs: true,
        hasSmartThermostat: false,
      },
    });
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);

    const ledRec = recs.find((r) => r.id === 'electricity-led-bulbs');
    expect(ledRec).toBeUndefined();
  });

  it('filters out renewable recommendation when already on renewable', () => {
    const profile = createProfile({
      electricity: {
        monthlyKwh: 900,
        energySource: 'renewable',
        householdSize: 2,
        usesLEDs: false,
        hasSmartThermostat: false,
      },
    });
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);

    const renewableRec = recs.find((r) => r.id === 'electricity-renewable');
    expect(renewableRec).toBeUndefined();
  });

  it('marks adopted recommendations correctly', () => {
    const profile = createProfile({
      adoptedRecommendations: ['transport-public-twice', 'food-reduce-red-meat'],
    });
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);

    const publicTransport = recs.find((r) => r.id === 'transport-public-twice');
    const redMeat = recs.find((r) => r.id === 'food-reduce-red-meat');

    if (publicTransport) expect(publicTransport.adopted).toBe(true);
    if (redMeat) expect(redMeat.adopted).toBe(true);
  });

  it('generates no car-related recs for bicycle-only user', () => {
    const profile = createProfile({
      transport: {
        entries: [{ mode: 'bicycle', distanceKmPerWeek: 50 }],
        ownsEV: false,
      },
    });
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);

    const carRecs = recs.filter(
      (r) => r.id === 'transport-public-twice' || r.id === 'transport-ev-switch'
    );
    expect(carRecs.length).toBe(0);
  });
});

describe('calculateTotalPotentialReduction', () => {
  it('sums non-adopted reductions', () => {
    const profile = createProfile();
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);
    const potential = calculateTotalPotentialReduction(recs);

    expect(potential.totalKgCO2).toBeGreaterThan(0);
    expect(potential.totalPercent).toBeGreaterThan(0);
  });

  it('excludes adopted recommendations', () => {
    const profile = createProfile({
      adoptedRecommendations: ['transport-public-twice'],
    });
    const footprint = calculateTotalFootprint(profile);
    const recs = generateRecommendations(footprint, profile);
    const potential = calculateTotalPotentialReduction(recs);

    const allRecs = generateRecommendations(
      footprint,
      createProfile()
    );
    const allPotential = calculateTotalPotentialReduction(allRecs);

    expect(potential.totalKgCO2).toBeLessThanOrEqual(allPotential.totalKgCO2);
  });
});
