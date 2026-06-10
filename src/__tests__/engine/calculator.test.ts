/**
 * Carbon Calculator Engine Tests
 *
 * Comprehensive unit tests for emission calculations across
 * transport, electricity, and food categories.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTransportEmissions,
  calculateElectricityEmissions,
  calculateFoodEmissions,
  calculateTotalFootprint,
} from '../../engine/calculator';
import type { UserProfile } from '../../types/carbon';

describe('calculateTransportEmissions', () => {
  it('calculates gasoline car emissions correctly', () => {
    const result = calculateTransportEmissions({
      entries: [{ mode: 'car_gasoline', distanceKmPerWeek: 100 }],
      ownsEV: false,
    });

    // 100 km/week * 0.21 kg/km * 52 weeks = 1092 kg/year
    expect(result.annualKgCO2).toBeCloseTo(1092, 0);
    expect(result.category).toBe('transport');
    expect(result.breakdown.length).toBeGreaterThan(0);
  });

  it('handles multiple transport modes', () => {
    const result = calculateTransportEmissions({
      entries: [
        { mode: 'car_gasoline', distanceKmPerWeek: 50 },
        { mode: 'bus', distanceKmPerWeek: 30 },
      ],
      ownsEV: false,
    });

    // 50*0.21*52 + 30*0.089*52 = 546 + 138.84 = 684.84
    expect(result.annualKgCO2).toBeCloseTo(684.84, 0);
    expect(result.breakdown.length).toBe(2);
  });

  it('returns zero for bicycle and walking', () => {
    const result = calculateTransportEmissions({
      entries: [
        { mode: 'bicycle', distanceKmPerWeek: 50 },
        { mode: 'walking', distanceKmPerWeek: 20 },
      ],
      ownsEV: false,
    });

    expect(result.annualKgCO2).toBe(0);
  });

  it('handles empty entries', () => {
    const result = calculateTransportEmissions({
      entries: [],
      ownsEV: false,
    });

    expect(result.annualKgCO2).toBe(0);
    expect(result.breakdown.length).toBe(0);
  });

  it('clamps negative distances to zero', () => {
    const result = calculateTransportEmissions({
      entries: [{ mode: 'car_gasoline', distanceKmPerWeek: -100 }],
      ownsEV: false,
    });

    expect(result.annualKgCO2).toBe(0);
  });

  it('handles NaN distance defensively', () => {
    const result = calculateTransportEmissions({
      entries: [{ mode: 'car_gasoline', distanceKmPerWeek: NaN }],
      ownsEV: false,
    });

    expect(result.annualKgCO2).toBe(0);
  });

  it('handles Infinity distance defensively', () => {
    const result = calculateTransportEmissions({
      entries: [{ mode: 'car_gasoline', distanceKmPerWeek: Infinity }],
      ownsEV: false,
    });

    expect(result.annualKgCO2).toBe(0);
  });

  it('calculates correct percentages in breakdown', () => {
    const result = calculateTransportEmissions({
      entries: [
        { mode: 'car_gasoline', distanceKmPerWeek: 100 },
        { mode: 'bus', distanceKmPerWeek: 100 },
      ],
      ownsEV: false,
    });

    const totalBreakdownPercent = result.breakdown.reduce(
      (sum, b) => sum + b.percentage,
      0
    );
    // Percentages should sum to approximately 100
    expect(totalBreakdownPercent).toBeCloseTo(100, 0);
  });
});

describe('calculateElectricityEmissions', () => {
  it('calculates grid mix emissions correctly', () => {
    const result = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 1,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    // 900 * 12 * 0.417 = 4503.6 kg/year
    expect(result.annualKgCO2).toBeCloseTo(4503.6, 0);
    expect(result.category).toBe('electricity');
  });

  it('divides by household size', () => {
    const single = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 1,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    const family = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 3,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    expect(family.annualKgCO2).toBeCloseTo(single.annualKgCO2 / 3, 0);
  });

  it('applies LED savings', () => {
    const withoutLEDs = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 1,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    const withLEDs = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 1,
      usesLEDs: true,
      hasSmartThermostat: false,
    });

    expect(withLEDs.annualKgCO2).toBeLessThan(withoutLEDs.annualKgCO2);
  });

  it('applies smart thermostat savings', () => {
    const without = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 1,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    const withThermostat = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 1,
      usesLEDs: false,
      hasSmartThermostat: true,
    });

    expect(withThermostat.annualKgCO2).toBeLessThan(without.annualKgCO2);
  });

  it('handles renewable energy source', () => {
    const result = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'renewable',
      householdSize: 1,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    // 900 * 12 * 0.02 = 216 kg/year
    expect(result.annualKgCO2).toBeCloseTo(216, 0);
  });

  it('handles zero kWh', () => {
    const result = calculateElectricityEmissions({
      monthlyKwh: 0,
      energySource: 'grid_mixed',
      householdSize: 1,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    expect(result.annualKgCO2).toBe(0);
  });

  it('clamps household size to minimum 1', () => {
    const result = calculateElectricityEmissions({
      monthlyKwh: 900,
      energySource: 'grid_mixed',
      householdSize: 0,
      usesLEDs: false,
      hasSmartThermostat: false,
    });

    // Should use household size of 1
    expect(result.annualKgCO2).toBeCloseTo(4503.6, 0);
  });
});

describe('calculateFoodEmissions', () => {
  it('calculates average diet baseline', () => {
    const result = calculateFoodEmissions({
      dietType: 'average',
      redMeatMealsPerWeek: 0,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: false,
      foodWasteLevel: 'low',
    });

    // Average diet baseline: 2500 kg/year
    expect(result.annualKgCO2).toBeCloseTo(2500, 0);
  });

  it('adds red meat emissions', () => {
    const withoutMeat = calculateFoodEmissions({
      dietType: 'average',
      redMeatMealsPerWeek: 0,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: false,
      foodWasteLevel: 'low',
    });

    const withMeat = calculateFoodEmissions({
      dietType: 'average',
      redMeatMealsPerWeek: 3,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: false,
      foodWasteLevel: 'low',
    });

    expect(withMeat.annualKgCO2).toBeGreaterThan(withoutMeat.annualKgCO2);
    // 3 * 7.2 * 52 = 1123.2 kg extra
    expect(withMeat.annualKgCO2 - withoutMeat.annualKgCO2).toBeCloseTo(1123.2, 0);
  });

  it('applies food waste multiplier', () => {
    const low = calculateFoodEmissions({
      dietType: 'average',
      redMeatMealsPerWeek: 0,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: false,
      foodWasteLevel: 'low',
    });

    const high = calculateFoodEmissions({
      dietType: 'average',
      redMeatMealsPerWeek: 0,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: false,
      foodWasteLevel: 'high',
    });

    // High waste: 1.25x, Low waste: 1.0x
    expect(high.annualKgCO2).toBeCloseTo(low.annualKgCO2 * 1.25, 0);
  });

  it('applies local food reduction', () => {
    const nonLocal = calculateFoodEmissions({
      dietType: 'average',
      redMeatMealsPerWeek: 0,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: false,
      foodWasteLevel: 'low',
    });

    const local = calculateFoodEmissions({
      dietType: 'average',
      redMeatMealsPerWeek: 0,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: true,
      foodWasteLevel: 'low',
    });

    expect(local.annualKgCO2).toBeLessThan(nonLocal.annualKgCO2);
  });

  it('vegan diet has lowest emissions', () => {
    const vegan = calculateFoodEmissions({
      dietType: 'vegan',
      redMeatMealsPerWeek: 0,
      poultryFishMealsPerWeek: 0,
      prefersLocalFood: false,
      foodWasteLevel: 'low',
    });

    const heavyMeat = calculateFoodEmissions({
      dietType: 'heavy_meat',
      redMeatMealsPerWeek: 7,
      poultryFishMealsPerWeek: 7,
      prefersLocalFood: false,
      foodWasteLevel: 'low',
    });

    expect(vegan.annualKgCO2).toBeLessThan(heavyMeat.annualKgCO2);
  });
});

describe('calculateTotalFootprint', () => {
  const mockProfile: UserProfile = {
    id: 'test-123',
    name: 'Test User',
    createdAt: '2024-01-01',
    transport: {
      entries: [{ mode: 'car_gasoline', distanceKmPerWeek: 100 }],
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
      redMeatMealsPerWeek: 3,
      poultryFishMealsPerWeek: 4,
      prefersLocalFood: false,
      foodWasteLevel: 'medium',
    },
    adoptedRecommendations: [],
    onboardingCompleted: true,
  };

  it('combines all three categories', () => {
    const result = calculateTotalFootprint(mockProfile);

    expect(result.totalAnnualKgCO2).toBeGreaterThan(0);
    expect(result.transport.annualKgCO2).toBeGreaterThan(0);
    expect(result.electricity.annualKgCO2).toBeGreaterThan(0);
    expect(result.food.annualKgCO2).toBeGreaterThan(0);
  });

  it('percentages sum to approximately 100', () => {
    const result = calculateTotalFootprint(mockProfile);

    const sum =
      result.percentages.transport +
      result.percentages.electricity +
      result.percentages.food;

    expect(sum).toBeCloseTo(100, 0);
  });

  it('calculates vs national average ratio', () => {
    const result = calculateTotalFootprint(mockProfile);

    expect(result.vsNationalAverage).toBeGreaterThan(0);
    expect(typeof result.vsNationalAverage).toBe('number');
  });

  it('includes calculation timestamp', () => {
    const result = calculateTotalFootprint(mockProfile);

    expect(result.calculatedAt).toBeTruthy();
    // Should be a valid ISO string
    expect(() => new Date(result.calculatedAt)).not.toThrow();
  });

  it('total equals sum of categories', () => {
    const result = calculateTotalFootprint(mockProfile);

    const sum =
      result.transport.annualKgCO2 +
      result.electricity.annualKgCO2 +
      result.food.annualKgCO2;

    expect(result.totalAnnualKgCO2).toBeCloseTo(sum, 1);
  });



  describe('Edge cases and Formatting', () => {
    it('should format unknown electricity source using fallback', () => {
      const data = {
        monthlyKwh: 100,
        energySource: 'nuclear',
        householdSize: 1,
        usesLEDs: false,
        hasSmartThermostat: false
      } as never;
      const result = calculateElectricityEmissions(data);
      expect(result.breakdown[0].label).toBe('Electricity (nuclear)');
    });

    it('should format unknown diet type using fallback', () => {
      const data = {
        dietType: 'breatharian',
        redMeatMealsPerWeek: 0,
        poultryFishMealsPerWeek: 0,
        foodWasteLevel: 'low',
        prefersLocalFood: false
      } as never;
      const result = calculateFoodEmissions(data);
      expect(result.breakdown[0].label).toBe('breatharian diet baseline');
    });

    it('should handle zero total emissions correctly for percentages', () => {
      const emptyTransport = calculateTransportEmissions({ ownsEV: false, entries: [] });
      expect(emptyTransport.annualKgCO2).toBe(0);

      const emptyElectricity = calculateElectricityEmissions({ monthlyKwh: 0, energySource: 'grid_mixed', householdSize: 1, usesLEDs: false, hasSmartThermostat: false });
      expect(emptyElectricity.annualKgCO2).toBe(0);

      const _emptyFood = calculateFoodEmissions({ dietType: 'vegan', redMeatMealsPerWeek: 0, poultryFishMealsPerWeek: 0, foodWasteLevel: 'low', prefersLocalFood: true });
      expect(_emptyFood.annualKgCO2).toBeDefined();
      
      const footprint = calculateTotalFootprint({ 
        ...mockProfile, 
        transport: { ownsEV: false, entries: [] }, 
        electricity: { monthlyKwh: 0, energySource: 'grid_mixed', householdSize: 1, usesLEDs: false, hasSmartThermostat: false }, 
        food: { dietType: 'vegan', redMeatMealsPerWeek: 0, poultryFishMealsPerWeek: 0, foodWasteLevel: 'low', prefersLocalFood: true } 
      });
      expect(footprint.percentages.transport).toBeDefined();
    });

    it('should format all known transport modes', () => {
      const allModes = [
        'car_gasoline', 'car_diesel', 'car_hybrid', 'car_electric',
        'bus', 'train', 'bicycle', 'walking', 'motorcycle', 'airplane'
      ];
      const entries = allModes.map(mode => ({ mode, distanceKmPerWeek: 10 }));
      const result = calculateTransportEmissions({ ownsEV: false, entries: entries as never });
      
      const labels = result.breakdown.map(b => b.label);
      expect(labels).toContain('Car (Gasoline)');
      expect(labels).toContain('Bus');
      expect(labels).toContain('Train');
      expect(labels).toContain('Motorcycle');
      expect(labels).toContain('Airplane');
      // bicycle and walking have 0 emissions so they won't appear in breakdown
    });

    it('should format all known energy sources', () => {
      const sources = ['grid_mixed', 'renewable', 'coal', 'natural_gas'];
      for (const source of sources) {
        const result = calculateElectricityEmissions({ monthlyKwh: 100, energySource: source as never, householdSize: 1, usesLEDs: false, hasSmartThermostat: false });
        expect(result.breakdown[0].label).not.toContain(source); // should be formatted
      }
    });

    it('should format all known diet types', () => {
      const diets = ['heavy_meat', 'average', 'low_meat', 'pescatarian', 'vegetarian', 'vegan'];
      for (const diet of diets) {
        const result = calculateFoodEmissions({ dietType: diet as never, redMeatMealsPerWeek: 0, poultryFishMealsPerWeek: 0, foodWasteLevel: 'low', prefersLocalFood: false });
        expect(result.breakdown[0].label).not.toContain(diet); // should be formatted
      }
    });
  });
});
