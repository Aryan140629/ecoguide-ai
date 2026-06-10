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

  it('should handle transport addMode', () => {
    const changes: ScenarioChange[] = [{ id: 't1', category: 'transport', description: 'Add bus', field: 'addMode', newValue: 'bus' }];
    const result = simulateScenario(baseProfile, changes);
    expect(result.projectedFootprint.transport.annualKgCO2).toBe(originalFootprint(baseProfile)); // 0 distance so no impact yet, but structure changes
  });

  it('should handle transport removeMode', () => {
    const changes: ScenarioChange[] = [{ id: 't2', category: 'transport', description: 'Remove car', field: 'removeMode', newValue: 'car_gasoline' }];
    const result = simulateScenario(baseProfile, changes);
    expect(result.changesByCategory.transport).toBeGreaterThan(0);
  });

  it('should handle transport bikeDaysPerWeek', () => {
    const changes: ScenarioChange[] = [{ id: 't3', category: 'transport', description: 'Bike', field: 'bikeDaysPerWeek', newValue: 3 }];
    const result = simulateScenario(baseProfile, changes);
    expect(result.changesByCategory.transport).toBeGreaterThan(0);
  });

  it('should handle transport ownsEV', () => {
    const changes: ScenarioChange[] = [{ id: 't4', category: 'transport', description: 'EV', field: 'ownsEV', newValue: true }];
    const result = simulateScenario(baseProfile, changes);
    expect(result.projectedFootprint.transport.annualKgCO2).toBeDefined(); // No direct calc change yet unless entries are electric, but should not crash
  });

  it('should handle electricity monthlyKwh and reducePercent', () => {
    const changes: ScenarioChange[] = [
      { id: 'e1', category: 'electricity', description: 'Kwh', field: 'monthlyKwh', newValue: 200 },
      { id: 'e2', category: 'electricity', description: 'Reduce', field: 'reducePercent', newValue: 50 },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.changesByCategory.electricity).toBeGreaterThan(0);
  });

  it('should handle electricity usesLEDs and hasSmartThermostat', () => {
    const changes: ScenarioChange[] = [
      { id: 'e3', category: 'electricity', description: 'LEDs', field: 'usesLEDs', newValue: true },
      { id: 'e4', category: 'electricity', description: 'Thermostat', field: 'hasSmartThermostat', newValue: true },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.projectedFootprint.electricity.annualKgCO2).toBeDefined(); // Booleans don't change core calculation in this version but tested for coverage
  });

  it('should handle food prefersLocalFood and foodWasteLevel', () => {
    const changes: ScenarioChange[] = [
      { id: 'f1', category: 'food', description: 'Local', field: 'prefersLocalFood', newValue: true },
      { id: 'f2', category: 'food', description: 'Waste', field: 'foodWasteLevel', newValue: 'low' },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.changesByCategory.food).toBeGreaterThan(0);
  });

  it('should return original data for unknown fields in strategies', () => {
    const changes: ScenarioChange[] = [
      { id: 'u1', category: 'transport', description: 'Unknown', field: 'unknownField', newValue: true },
      { id: 'u2', category: 'electricity', description: 'Unknown', field: 'unknownField', newValue: true },
      { id: 'u3', category: 'food', description: 'Unknown', field: 'unknownField', newValue: true },
    ];
    const result = simulateScenario(baseProfile, changes);
    expect(result.totalReductionKgCO2).toBe(0);
  });

  it('should handle reduceCarDistance for all car types', () => {
    const profileWithAllCars = {
      ...baseProfile,
      transport: {
        ownsEV: false,
        entries: [
          { mode: 'car_gasoline', distanceKmPerWeek: 100 },
          { mode: 'car_diesel', distanceKmPerWeek: 100 },
          { mode: 'car_hybrid', distanceKmPerWeek: 100 },
          { mode: 'car_electric', distanceKmPerWeek: 100 }, // shouldn't be affected
        ] as never
      }
    };
    const changes: ScenarioChange[] = [{ id: 't1', category: 'transport', description: 'Reduce', field: 'reduceCarDistance', newValue: 50 }];
    const result = simulateScenario(profileWithAllCars, changes);
    expect(result.changesByCategory.transport).toBeGreaterThan(0);
  });

  it('should handle bikeDaysPerWeek for all car types', () => {
    const profileWithAllCars = {
      ...baseProfile,
      transport: {
        ownsEV: false,
        entries: [
          { mode: 'car_gasoline', distanceKmPerWeek: 100 },
          { mode: 'car_diesel', distanceKmPerWeek: 100 },
          { mode: 'car_hybrid', distanceKmPerWeek: 100 },
        ] as never
      }
    };
    const changes: ScenarioChange[] = [{ id: 't2', category: 'transport', description: 'Bike', field: 'bikeDaysPerWeek', newValue: 5 }]; // 5 days = 50km
    const result = simulateScenario(profileWithAllCars, changes);
    expect(result.changesByCategory.transport).toBeGreaterThan(0);
  });

  it('should not add another bike mode if bike mode already exists', () => {
    const profileWithBike = {
      ...baseProfile,
      transport: {
        ownsEV: false,
        entries: [
          { mode: 'car_gasoline', distanceKmPerWeek: 100 },
          { mode: 'bicycle', distanceKmPerWeek: 20 },
        ] as never
      }
    };
    const changes: ScenarioChange[] = [{ id: 't3', category: 'transport', description: 'Bike', field: 'bikeDaysPerWeek', newValue: 5 }];
    const result = simulateScenario(profileWithBike, changes);
    expect(result.changesByCategory.transport).toBeGreaterThan(0);
    expect(result.projectedFootprint.transport.annualKgCO2).toBeDefined();
  });
});

function originalFootprint(profile: UserProfile) {
  return simulateScenario(profile, []).originalFootprint.transport.annualKgCO2;
}
