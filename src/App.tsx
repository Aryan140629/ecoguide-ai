/**
 * EcoGuide AI — App Entry
 *
 * React Router setup with lazy-loaded routes, Suspense boundaries,
 * and route guard for onboarding.
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider, useProfile } from './hooks/useProfile';
import { GoalsProvider } from './hooks/useGoals';
import { AppShell } from './components/layout/AppShell';

// Lazy-loaded feature routes for code splitting
const OnboardingFlow = lazy(() =>
  import('./features/onboarding/OnboardingFlow').then((m) => ({ default: m.OnboardingFlow }))
);
const Dashboard = lazy(() =>
  import('./features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const Calculator = lazy(() =>
  import('./features/calculator/Calculator').then((m) => ({ default: m.Calculator }))
);
const Coach = lazy(() =>
  import('./features/coach/Coach').then((m) => ({ default: m.Coach }))
);
const Simulator = lazy(() =>
  import('./features/simulator/Simulator').then((m) => ({ default: m.Simulator }))
);
const Goals = lazy(() =>
  import('./features/goals/Goals').then((m) => ({ default: m.Goals }))
);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" role="status" aria-label="Loading page">
      <div className="text-center space-y-4">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="text-6xl" aria-hidden="true">🍃</span>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Page Not Found</h2>
      <p className="text-slate-600 dark:text-slate-400">
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/dashboard"
        className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
      >
        ← Return to Dashboard
      </a>
    </div>
  );
}

/**
 * Route guard: redirects to onboarding if no profile exists.
 */
function RequireProfile({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  if (!profile || !profile.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route
            path="/dashboard"
            element={
              <RequireProfile>
                <Dashboard />
              </RequireProfile>
            }
          />
          <Route
            path="/calculator"
            element={
              <RequireProfile>
                <Calculator />
              </RequireProfile>
            }
          />
          <Route
            path="/coach"
            element={
              <RequireProfile>
                <Coach />
              </RequireProfile>
            }
          />
          <Route
            path="/simulator"
            element={
              <RequireProfile>
                <Simulator />
              </RequireProfile>
            }
          />
          <Route
            path="/goals"
            element={
              <RequireProfile>
                <Goals />
              </RequireProfile>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <GoalsProvider>
          <AppRoutes />
        </GoalsProvider>
      </ProfileProvider>
    </BrowserRouter>
  );
}
