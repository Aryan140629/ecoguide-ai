import { describe, it, expect } from 'vitest';
import { evaluateBadges } from '../../engine/badges';
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
});
