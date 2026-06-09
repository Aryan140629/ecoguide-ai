/**
 * Profile Context & Hook
 *
 * Provides global user profile state via React Context + useReducer.
 * Persists profile to localStorage on every change.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  UserProfile,
  TransportData,
  ElectricityData,
  FoodData,
} from '../types/carbon';
import { saveProfile, loadProfile } from '../services/storage';

// ─── Actions ────────────────────────────────────────────────────

type ProfileAction =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'UPDATE_TRANSPORT'; payload: TransportData }
  | { type: 'UPDATE_ELECTRICITY'; payload: ElectricityData }
  | { type: 'UPDATE_FOOD'; payload: FoodData }
  | { type: 'ADOPT_RECOMMENDATION'; payload: string }
  | { type: 'UNADOPT_RECOMMENDATION'; payload: string }
  | { type: 'RESET' };

// ─── Reducer ────────────────────────────────────────────────────

function profileReducer(
  state: UserProfile | null,
  action: ProfileAction
): UserProfile | null {
  switch (action.type) {
    case 'SET_PROFILE':
      return action.payload;

    case 'UPDATE_TRANSPORT':
      if (!state) return state;
      return { ...state, transport: action.payload };

    case 'UPDATE_ELECTRICITY':
      if (!state) return state;
      return { ...state, electricity: action.payload };

    case 'UPDATE_FOOD':
      if (!state) return state;
      return { ...state, food: action.payload };

    case 'ADOPT_RECOMMENDATION':
      if (!state) return state;
      if (state.adoptedRecommendations.includes(action.payload)) return state;
      return {
        ...state,
        adoptedRecommendations: [...state.adoptedRecommendations, action.payload],
      };

    case 'UNADOPT_RECOMMENDATION':
      if (!state) return state;
      return {
        ...state,
        adoptedRecommendations: state.adoptedRecommendations.filter(
          (id) => id !== action.payload
        ),
      };

    case 'RESET':
      return null;

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────

interface ProfileContextValue {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  updateTransport: (data: TransportData) => void;
  updateElectricity: (data: ElectricityData) => void;
  updateFood: (data: FoodData) => void;
  adoptRecommendation: (id: string) => void;
  unadoptRecommendation: (id: string) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, dispatch] = useReducer(profileReducer, null, () => loadProfile());

  // Persist to localStorage on every profile change
  useEffect(() => {
    if (profile) {
      saveProfile(profile);
    }
  }, [profile]);

  const setProfile = useCallback(
    (p: UserProfile) => dispatch({ type: 'SET_PROFILE', payload: p }),
    []
  );

  const updateTransport = useCallback(
    (data: TransportData) => dispatch({ type: 'UPDATE_TRANSPORT', payload: data }),
    []
  );

  const updateElectricity = useCallback(
    (data: ElectricityData) => dispatch({ type: 'UPDATE_ELECTRICITY', payload: data }),
    []
  );

  const updateFood = useCallback(
    (data: FoodData) => dispatch({ type: 'UPDATE_FOOD', payload: data }),
    []
  );

  const adoptRecommendation = useCallback(
    (id: string) => dispatch({ type: 'ADOPT_RECOMMENDATION', payload: id }),
    []
  );

  const unadoptRecommendation = useCallback(
    (id: string) => dispatch({ type: 'UNADOPT_RECOMMENDATION', payload: id }),
    []
  );

  const resetProfile = useCallback(
    () => dispatch({ type: 'RESET' }),
    []
  );

  const value: ProfileContextValue = useMemo(() => ({
    profile,
    setProfile,
    updateTransport,
    updateElectricity,
    updateFood,
    adoptRecommendation,
    unadoptRecommendation,
    resetProfile,
  }), [
    profile,
    setProfile,
    updateTransport,
    updateElectricity,
    updateFood,
    adoptRecommendation,
    unadoptRecommendation,
    resetProfile,
  ]);

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile(): ProfileContextValue {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
