import { describe, it, expect } from 'vitest';
import { evaluateBadges, countBadgesByTier } from '../../engine/badges';
import type { UserProfile } from '../../types/carbon';

describe('Badges Engine', () => {
  it('should unlock the Quick Starter badge for completing onboarding', () => {
    const profile: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [{ mode: 'car_gasoline', distanceKmPerWeek: 100 }], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'average', redMeatMealsPerWeek: 3, poultryFishMealsPerWeek: 3, foodWasteLevel: 'low', prefersLocalFood: false },
    };
    const unlocked = evaluateBadges(profile as UserProfile, null, []).map((b) => b.id);
    expect(unlocked).toContain('first-step');
  });

  it('should unlock Action Taker when adopting a recommendation', () => {
    const profile: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: ['rec_1', 'rec_2', 'rec_3'],
      transport: { entries: [], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'average', redMeatMealsPerWeek: 3, poultryFishMealsPerWeek: 3, foodWasteLevel: 'low', prefersLocalFood: false },
    };
    const unlocked = evaluateBadges(profile as UserProfile, null, []).map((b) => b.id);
    expect(unlocked).toContain('action-taker');
  });

  it('should unlock Eco Warrior when adopting 7 or more recommendations', () => {
    const profile: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: ['1', '2', '3', '4', '5', '6', '7'],
      transport: { entries: [], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'average', redMeatMealsPerWeek: 3, poultryFishMealsPerWeek: 3, foodWasteLevel: 'low', prefersLocalFood: false },
    };
    const unlocked = evaluateBadges(profile as UserProfile, null, []).map((b) => b.id);
    expect(unlocked).toContain('eco-warrior');
  });

  it('should unlock Zero Waste Hero for low food waste', () => {
    const profile: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: {
        dietType: 'average',
        redMeatMealsPerWeek: 3,
        poultryFishMealsPerWeek: 3,
        foodWasteLevel: 'low',
        prefersLocalFood: false
      },
    };
    const unlocked = evaluateBadges(profile as UserProfile, null, []).map((b) => b.id);
    expect(unlocked).toContain('waste-reducer');
  });

  it('should unlock Plant Power for vegan/vegetarian diets', () => {
    const profile1: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'vegan', redMeatMealsPerWeek: 0, poultryFishMealsPerWeek: 0, foodWasteLevel: 'medium', prefersLocalFood: false },
    };
    const unlocked1 = evaluateBadges(profile1 as UserProfile, null, []).map((b) => b.id);
    expect(unlocked1).toContain('plant-powered');

    const profile2: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'vegetarian', redMeatMealsPerWeek: 0, poultryFishMealsPerWeek: 0, foodWasteLevel: 'medium', prefersLocalFood: false },
    };
    const unlocked2 = evaluateBadges(profile2 as UserProfile, null, []).map((b) => b.id);
    expect(unlocked2).toContain('plant-powered');
  });

  it('should unlock Clean Energy for renewable energy source', () => {
    const profile: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'average', redMeatMealsPerWeek: 3, poultryFishMealsPerWeek: 3, foodWasteLevel: 'low', prefersLocalFood: false },
    };
    const unlocked = evaluateBadges(profile as UserProfile, null, []).map((b) => b.id);
    expect(unlocked).toContain('renewable-warrior');
  });

  it('should unlock Active Commuter for walking/biking', () => {
    const profile: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [{ mode: 'bicycle', distanceKmPerWeek: 50 }], ownsEV: false },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'average', redMeatMealsPerWeek: 3, poultryFishMealsPerWeek: 3, foodWasteLevel: 'low', prefersLocalFood: false },
    };
    const unlocked = evaluateBadges(profile as UserProfile, null, []).map((b) => b.id);
    expect(unlocked).toContain('green-commuter');
  });

  it('should unlock EV Pioneer for electric cars', () => {
    const profile: Partial<UserProfile> = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [{ mode: 'car_electric', distanceKmPerWeek: 100 }], ownsEV: true },
      electricity: { monthlyKwh: 100, energySource: 'renewable', householdSize: 1, usesLEDs: false, hasSmartThermostat: false },
      food: { dietType: 'average', redMeatMealsPerWeek: 3, poultryFishMealsPerWeek: 3, foodWasteLevel: 'low', prefersLocalFood: false },
    };
    const unlocked = evaluateBadges(profile as UserProfile, null, []).map((b) => b.id);
    expect(unlocked).toContain('ev-pioneer');
  });

  it('should unlock Below Average, Half & Half, and Climate Champion based on footprint', () => {
    const profile = { onboardingCompleted: true, adoptedRecommendations: [], transport: { entries: [] }, electricity: {}, food: {} } as unknown as UserProfile;
    
    // NATIONAL_AVERAGE_KG_CO2 is likely around 15000, let's use small numbers
    const footprintBelow = { totalAnnualKgCO2: 10000 } as never;
    expect(evaluateBadges(profile, footprintBelow, []).map((b) => b.id)).toContain('below-average');

    const footprintHalf = { totalAnnualKgCO2: 5000 } as never;
    expect(evaluateBadges(profile, footprintHalf, []).map((b) => b.id)).toContain('half-footprint');

    const footprintQuarter = { totalAnnualKgCO2: 2000 } as never;
    expect(evaluateBadges(profile, footprintQuarter, []).map((b) => b.id)).toContain('climate-champion');
  });

  it('should unlock LED Hero and Smart Home', () => {
    const profile = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [] },
      electricity: { usesLEDs: true, hasSmartThermostat: true, energySource: 'grid_mixed' },
      food: {}
    } as unknown as UserProfile;
    const unlocked = evaluateBadges(profile, null, []).map((b) => b.id);
    expect(unlocked).toContain('led-hero');
    expect(unlocked).toContain('smart-home');
  });

  it('should unlock Local Champion', () => {
    const profile = {
      onboardingCompleted: true,
      adoptedRecommendations: [],
      transport: { entries: [] },
      electricity: { energySource: 'grid_mixed' },
      food: { prefersLocalFood: true }
    } as unknown as UserProfile;
    const unlocked = evaluateBadges(profile, null, []).map((b) => b.id);
    expect(unlocked).toContain('local-champion');
  });

  it('should unlock Sustainability Master', () => {
    const profile = {
      onboardingCompleted: true,
      adoptedRecommendations: Array.from({ length: 12 }, (_, i) => String(i)),
      transport: { entries: [] },
      electricity: { energySource: 'grid_mixed' },
      food: {}
    } as unknown as UserProfile;
    const footprintBelow = { totalAnnualKgCO2: 1000 } as never;
    const unlocked = evaluateBadges(profile, footprintBelow, []).map((b) => b.id);
    expect(unlocked).toContain('sustainability-master');
  });

  it('should count badges by tier correctly', () => {
    const mockBadges = [
      { id: '1', tier: 'bronze', earnedAt: '2024' },
      { id: '2', tier: 'bronze', earnedAt: '2024' },
      { id: '3', tier: 'silver', earnedAt: '2024' },
      { id: '4', tier: 'gold', earnedAt: null }, // not earned
      { id: '5', tier: 'platinum', earnedAt: '2024' }
    ] as never;
    const counts = countBadgesByTier(mockBadges);
    expect(counts.bronze).toBe(2);
    expect(counts.silver).toBe(1);
    expect(counts.gold).toBe(0);
    expect(counts.platinum).toBe(1);
  });
});
