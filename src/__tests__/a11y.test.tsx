import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as matchers from 'vitest-axe/matchers';
import { axe } from 'vitest-axe';
import { MemoryRouter } from 'react-router-dom';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Calculator } from '../features/calculator/Calculator';
import { ProfileProvider } from '../hooks/useProfile';
import { GoalsProvider } from '../hooks/useGoals';
import type { UserProfile } from '../types/carbon';

expect.extend(matchers);

const mockProfile: UserProfile = {
  id: 'user_1',
  name: 'A11y Test',
  createdAt: new Date().toISOString(),
  onboardingCompleted: true,
  adoptedRecommendations: [],
  transport: { entries: [{ mode: 'car_gasoline', distanceKmPerWeek: 100 }], ownsEV: false },
  electricity: { monthlyKwh: 300, energySource: 'grid_mixed', householdSize: 2, usesLEDs: true, hasSmartThermostat: false },
  food: { dietType: 'average', redMeatMealsPerWeek: 3, poultryFishMealsPerWeek: 3, foodWasteLevel: 'medium', prefersLocalFood: false }
};

describe('Accessibility tests', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <ProfileProvider initialProfile={mockProfile}>
        <GoalsProvider>
          {children}
        </GoalsProvider>
      </ProfileProvider>
    </MemoryRouter>
  );

  it('Dashboard should have no accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );
    const results = await axe(container);
    // @ts-expect-error vitest-axe typing is incomplete
    expect(results).toHaveNoViolations();
  });

  it('Calculator should have no accessibility violations', async () => {
    const { container } = render(
      <TestWrapper>
        <Calculator />
      </TestWrapper>
    );
    const results = await axe(container);
    // @ts-expect-error vitest-axe typing is incomplete
    expect(results).toHaveNoViolations();
  });
});
