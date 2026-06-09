import { describe, it, expect } from 'vitest';
import { simulateScenario } from '../../engine/scenario';
import type { UserProfile, ScenarioChange } from '../../types/carbon';

describe('Scenario Simulator Engine', () => {
  const baseProfile: UserProfile = {
    id: 'user_1',
    name: 'Test',
    createdAt: new Date().toISOString(),
    onboardingCompleted: true,
    adoptedRecommendations: [],
    transport: { entries: [{ mode: 'car_gasoline', distanceKmPerWeek: 200 }], ownsEV: false },
    electricity: { monthlyKwh: 400, energySource: 'grid_mixed', householdSize: 2, usesLEDs: false, hasSmartThermostat: false },
    food: { dietType: 'average', redMeatMealsPerWeek: 5, poultryFishMealsPerWeek: 5, foodWasteLevel: 'medium', prefersLocalFood: false },
  };



  it('should calculate impact of transport change (reduce car distance)', () => {
    const changes: ScenarioChange[] = [
      { id: '1', category: 'transport', description: 'Reduce car use', field: 'reduceCarDistance', newValue: 50 },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.totalReductionKgCO2).toBeGreaterThan(0);
    expect(result.changesByCategory.transport).toBeGreaterThan(0);
  });

  it('should calculate impact of electricity change (switch to renewable)', () => {
    const changes: ScenarioChange[] = [
      { id: '2', category: 'electricity', description: 'Renewable energy', field: 'energySource', newValue: 'renewable' },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.totalReductionKgCO2).toBeGreaterThan(0);
    expect(result.changesByCategory.electricity).toBeGreaterThan(0);
  });

  it('should calculate impact of food change (go vegan)', () => {
    const changes: ScenarioChange[] = [
      { id: '3', category: 'food', description: 'Go vegan', field: 'dietType', newValue: 'vegan' },
      { id: '4', category: 'food', description: 'No red meat', field: 'redMeatMealsPerWeek', newValue: 0 },
      { id: '5', category: 'food', description: 'No poultry', field: 'poultryFishMealsPerWeek', newValue: 0 },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.totalReductionKgCO2).toBeGreaterThan(0);
    expect(result.changesByCategory.food).toBeGreaterThan(0);
  });

  it('should handle multiple changes at once', () => {
    const changes: ScenarioChange[] = [
      { id: '1', category: 'transport', description: 'Reduce car use', field: 'reduceCarDistance', newValue: 50 },
      { id: '2', category: 'electricity', description: 'Renewable energy', field: 'energySource', newValue: 'renewable' },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.totalReductionKgCO2).toBeGreaterThan(0);
    expect(result.changesByCategory.transport).toBeGreaterThan(0);
    expect(result.changesByCategory.electricity).toBeGreaterThan(0);
  });
});
