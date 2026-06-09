/**
 * Goals Hook
 *
 * CRUD operations for sustainability goals with
 * localStorage persistence and progress tracking.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { Goal, GoalStatus } from '../types/carbon';
import { saveGoals, loadGoals } from '../services/storage';

interface GoalsContextValue {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'status'>) => void;
  updateGoalProgress: (id: string, currentKgCO2: number) => void;
  removeGoal: (id: string) => void;
  getGoalProgress: (goal: Goal) => number;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

let goalIdCounter = Date.now();

function generateGoalId(): string {
  return `goal_${goalIdCounter++}`;
}

function computeGoalStatus(goal: Goal): GoalStatus {
  const progress = goal.baselineKgCO2 > 0
    ? ((goal.baselineKgCO2 - goal.currentKgCO2) / goal.baselineKgCO2) * 100
    : 0;

  if (progress >= goal.targetReductionPercent) return 'completed';
  if (new Date(goal.endDate) < new Date()) return 'expired';
  return 'active';
}

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const addGoal = useCallback(
    (goalData: Omit<Goal, 'id' | 'status'>) => {
      const newGoal: Goal = {
        ...goalData,
        id: generateGoalId(),
        status: 'active',
      };
      setGoals((prev) => [...prev, newGoal]);
    },
    []
  );

  const updateGoalProgress = useCallback((id: string, currentKgCO2: number) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== id) return goal;
        const updated = { ...goal, currentKgCO2 };
        return { ...updated, status: computeGoalStatus(updated) };
      })
    );
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const getGoalProgress = useCallback((goal: Goal): number => {
    if (goal.baselineKgCO2 <= 0) return 0;
    const reduction = goal.baselineKgCO2 - goal.currentKgCO2;
    const targetReduction = (goal.baselineKgCO2 * goal.targetReductionPercent) / 100;
    if (targetReduction <= 0) return 0;
    return Math.min(100, Math.max(0, (reduction / targetReduction) * 100));
  }, []);

  const value = useMemo(() => ({
    goals, addGoal, updateGoalProgress, removeGoal, getGoalProgress
  }), [goals, addGoal, updateGoalProgress, removeGoal, getGoalProgress]);

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGoals(): GoalsContextValue {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}
