import { saveProfile, saveGoals, saveHistory } from './storage';
import { calculateTotalFootprint } from '../engine/calculator';
import type { UserProfile, Goal, EmissionSnapshot } from '../types/carbon';

export function loadDemoData() {
  const profile: UserProfile = {
    id: 'demo_user_1',
    name: 'Alex (Demo)',
    createdAt: new Date().toISOString(),
    onboardingCompleted: true,
    adoptedRecommendations: ['rec_led', 'rec_bike', 'rec_thermostat'],
    transport: {
      ownsEV: false,
      entries: [
        { mode: 'car_gasoline', distanceKmPerWeek: 150 },
        { mode: 'bicycle', distanceKmPerWeek: 50 }
      ]
    },
    electricity: {
      monthlyKwh: 350,
      energySource: 'grid_mixed',
      householdSize: 2,
      usesLEDs: true,
      hasSmartThermostat: true
    },
    food: {
      dietType: 'low_meat',
      redMeatMealsPerWeek: 2,
      poultryFishMealsPerWeek: 3,
      foodWasteLevel: 'low',
      prefersLocalFood: true
    }
  };

  const footprint = calculateTotalFootprint(profile);

  const goals: Goal[] = [
    {
      id: 'g1',
      title: 'Reduce Car Usage',
      targetReductionPercent: 10,
      baselineKgCO2: 5000,
      currentKgCO2: 5000,
      category: 'transport',
      targetReductionKgCO2: 500,
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      status: 'active',
    },
    {
      id: 'g2',
      title: 'Eat Less Red Meat',
      targetReductionPercent: 20,
      baselineKgCO2: 3000,
      currentKgCO2: 2400,
      category: 'food',
      targetReductionKgCO2: 300,
      startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // overdue/completed
      status: 'completed',
    }
  ];

  const now = new Date();
  const history: EmissionSnapshot[] = [];
  
  // Generate 6 months of historical data showing a downward trend
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const multiplier = 1 + (i * 0.05); // 5% higher each month backwards
    history.push({
      date: d.toISOString(),
      totalAnnualKgCO2: Math.round(footprint.totalAnnualKgCO2 * multiplier),
      transport: Math.round(footprint.transport.annualKgCO2 * multiplier),
      electricity: Math.round(footprint.electricity.annualKgCO2 * multiplier),
      food: Math.round(footprint.food.annualKgCO2 * multiplier),
    });
  }

  saveProfile(profile);
  saveGoals(goals);
  saveHistory(history);
  
  window.location.reload();
}
