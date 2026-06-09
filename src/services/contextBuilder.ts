import type {
  UserProfile,
  CarbonFootprint,
  Recommendation,
  Goal,
} from '../types/carbon';
import { SYSTEM_PROMPT } from './systemPrompt';

export function buildCoachContext(
  profile: UserProfile | null,
  footprint: CarbonFootprint | null,
  recommendations: Recommendation[],
  goals: Goal[]
): string {
  if (!profile || !footprint) {
    return `
${SYSTEM_PROMPT}

=== USER CONTEXT ===
The user has not completed onboarding yet.
Encourage them to complete their profile to get personalized carbon insights.
`;
  }

  // -------------------------
  // USER PROFILE
  // -------------------------
  const transportModes = profile.transport.entries
    .map((e) => `${e.mode} (${e.distanceKmPerWeek} km/week)`)
    .join(', ');

  const profileSection = `
USER PROFILE:
- Name: ${profile.name}
- Transport: ${transportModes}
- Owns EV: ${profile.transport.ownsEV}
- Energy Usage: ${profile.electricity.monthlyKwh} kWh/month
- Energy Source: ${profile.electricity.energySource}
- Household Size: ${profile.electricity.householdSize}
- Diet: ${profile.food.dietType}
- Red Meat: ${profile.food.redMeatMealsPerWeek} meals/week
- Poultry/Fish: ${profile.food.poultryFishMealsPerWeek} meals/week
- Food Waste Level: ${profile.food.foodWasteLevel}
`;

  // -------------------------
  // CARBON FOOTPRINT (TRUTH SOURCE)
  // -------------------------
  const footprintSection = `
CARBON FOOTPRINT (ENGINE TRUTH - DO NOT MODIFY):
- Total Annual: ${footprint.totalAnnualKgCO2} kg CO2

Breakdown:
- Transport: ${footprint.transport.annualKgCO2} kg CO2 (${footprint.percentages.transport}%)
- Electricity: ${footprint.electricity.annualKgCO2} kg CO2 (${footprint.percentages.electricity}%)
- Food: ${footprint.food.annualKgCO2} kg CO2 (${footprint.percentages.food}%)

- Compared to national average: ${footprint.vsNationalAverage * 100}%
`;

  // -------------------------
  // RECOMMENDATIONS (STRICT ACTION SET)
  // -------------------------
  const nonAdopted = recommendations.filter((r) => !r.adopted).slice(0, 5);
  const adopted = recommendations.filter((r) => r.adopted);

  const recsSection = `
TOP RECOMMENDATIONS (ONLY VALID ACTIONS - DO NOT INVENT OTHERS):

TRANSPORT / ENERGY / FOOD ACTIONS ARE SEPARATE CONTEXT DOMAINS.
DO NOT CROSS RECOMMEND ACROSS DOMAINS.

${nonAdopted.length > 0
      ? nonAdopted
        .map(
          (r, i) =>
            `${i + 1}. ${r.action}
   - Category: ${r.category || 'GENERAL'}
   - Impact: ${r.estimatedReductionKgCO2} kg CO2/year
   - Percent: ${r.estimatedReductionPercent}%
   - Difficulty: ${r.difficulty}`
        )
        .join('\n\n')
      : 'No available recommendations found in engine data.'}

ADOPTED ACTIONS (acknowledge only):
${adopted.length > 0 ? adopted.map((r) => `- ${r.action}`).join('\n') : 'None yet'}
`;

  // -------------------------
  // GOALS
  // -------------------------
  const activeGoals = goals.filter((g) => g.status === 'active');

  const goalsSection = `
ACTIVE GOALS:
${activeGoals.length > 0
      ? activeGoals
        .map(
          (g) =>
            `- ${g.title}: Target ${g.targetReductionPercent}% reduction
   Current: ${g.currentKgCO2} kg CO2
   Baseline: ${g.baselineKgCO2} kg CO2`
        )
        .join('\n')
      : 'No active goals set.'
    }
`;

  // -------------------------
  // FINAL CONTEXT (STRICT STRUCTURE)
  // -------------------------
  let context = `
=== SYSTEM INSTRUCTIONS ===
${SYSTEM_PROMPT}

=== ENGINE OUTPUT (TRUTH SOURCE - NEVER MODIFY) ===
${footprintSection}

=== USER PROFILE ===
${profileSection}

=== TOP RECOMMENDATIONS (STRICT CLOSED SET) ===
${recsSection}

=== GOALS ===
${goalsSection}

STRICT RULES:
- Only use recommendations listed above
- Do NOT suggest external or missing actions
- Do NOT mix categories (transport/food/energy)
- If category data is missing, explicitly say so
`;

  // safety truncation
  if (context.length > 15000) {
    context = context.substring(0, 15000) + '... [TRUNCATED]';
  }

  return context;
}