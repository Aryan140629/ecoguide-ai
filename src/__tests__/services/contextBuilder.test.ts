import { describe, it, expect } from 'vitest';
import { buildCoachContext } from '../../services/contextBuilder';
import { SYSTEM_PROMPT } from '../../services/systemPrompt';
import type { UserProfile, CarbonFootprint, Recommendation, Goal } from '../../types/carbon';

describe('contextBuilder', () => {
  const mockProfile: UserProfile = {
    id: '123',
    name: 'Jane',
    createdAt: '2023-01-01',
    transport: { entries: [{ mode: 'bus', distanceKmPerWeek: 50 }], ownsEV: false },
    electricity: { monthlyKwh: 500, energySource: 'renewable', householdSize: 2, usesLEDs: true, hasSmartThermostat: true },
    food: { dietType: 'vegetarian', redMeatMealsPerWeek: 0, poultryFishMealsPerWeek: 0, prefersLocalFood: true, foodWasteLevel: 'low' },
    adoptedRecommendations: ['rec-1'],
    onboardingCompleted: true,
  };

  const mockFootprint: CarbonFootprint = {
    transport: { annualKgCO2: 100, category: 'transport', breakdown: [] },
    electricity: { annualKgCO2: 200, category: 'electricity', breakdown: [] },
    food: { annualKgCO2: 300, category: 'food', breakdown: [] },
    totalAnnualKgCO2: 600,
    percentages: { transport: 16.7, electricity: 33.3, food: 50 },
    vsNationalAverage: 0.05,
    calculatedAt: '2023-01-01',
  };

  const mockRecommendations: Recommendation[] = [
    {
      id: 'rec-1',
      category: 'transport',
      action: 'Adopted Action',
      description: 'Desc',
      estimatedReductionKgCO2: 50,
      estimatedReductionPercent: 8,
      difficulty: 'easy',
      timeframe: 'immediate',
      adopted: true,
      icon: '🚗',
    },
    {
      id: 'rec-2',
      category: 'electricity',
      action: 'Available Action',
      description: 'Desc',
      estimatedReductionKgCO2: 100,
      estimatedReductionPercent: 16,
      difficulty: 'moderate',
      timeframe: 'short_term',
      adopted: false,
      icon: '⚡',
    },
  ];

  const mockGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Reduce Energy',
      targetReductionPercent: 10,
      targetReductionKgCO2: 60,
      baselineKgCO2: 600,
      currentKgCO2: 600,
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      status: 'active',
      category: 'electricity',
    },
  ];

  it('should return onboarding message if profile is null', () => {
    const context = buildCoachContext(null, null, [], []);
    expect(context).toContain('The user has not completed onboarding yet');
    expect(context).toContain(SYSTEM_PROMPT);
  });

  it('should include profile data', () => {
    const context = buildCoachContext(mockProfile, mockFootprint, mockRecommendations, mockGoals);
    expect(context).toContain('Name: Jane');
    expect(context).toContain('bus (50 km/week)');
    expect(context).toContain('Diet: vegetarian');
  });

  it('should include footprint data', () => {
    const context = buildCoachContext(mockProfile, mockFootprint, mockRecommendations, mockGoals);
    expect(context).toContain('Total Annual: 600 kg CO2');
    expect(context).toContain('Transport: 100 kg CO2 (16.7%)');
  });

  it('should include recommendations separated by adopted status', () => {
    const context = buildCoachContext(mockProfile, mockFootprint, mockRecommendations, mockGoals);
    expect(context).toContain('Available Action');
    expect(context).toContain('Adopted Action');
  });

  it('should include active goals', () => {
    const context = buildCoachContext(mockProfile, mockFootprint, mockRecommendations, mockGoals);
    expect(context).toContain('Reduce Energy: Target 10% reduction');
  });

  it('should truncate if context is too large', () => {
    // Create a massive string to force truncation
    const massiveProfile = { ...mockProfile, name: 'A'.repeat(20000) };
    const context = buildCoachContext(massiveProfile, mockFootprint, mockRecommendations, mockGoals);
    expect(context.length).toBeLessThanOrEqual(15000 + '... [TRUNCATED]'.length);
    expect(context.endsWith('[TRUNCATED]')).toBe(true);
  });

  it('should handle empty recommendations and goals', () => {
    const context = buildCoachContext(mockProfile, mockFootprint, [], []);
    expect(context).toContain('No available recommendations found in engine data.');
    expect(context).toContain('None yet');
    expect(context).toContain('No active goals set.');
  });
});
