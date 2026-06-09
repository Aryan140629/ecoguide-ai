import { describe, it, expect, beforeEach } from 'vitest';
import { saveProfile, loadProfile, saveGoals, loadGoals, clearAllData, saveHistory, loadHistory, addHistorySnapshot, exportData } from '../../services/storage';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return null for empty profile', () => {
    expect(loadProfile()).toBeNull();
  });

  it('should return empty array for empty goals', () => {
    expect(loadGoals()).toEqual([]);
  });

  it('should save and load a profile', () => {
    const profile = { id: '1', name: 'Test', transport: {}, electricity: {}, food: {}, onboardingCompleted: true, adoptedRecommendations: [] } as unknown as import('../../types/carbon').UserProfile;
    saveProfile(profile);
    const loaded = loadProfile();
    expect(loaded).toEqual(profile);
  });

  it('should save and load goals', () => {
    const goals = [{ id: '1', title: 'Test' }] as unknown as import('../../types/carbon').Goal[];
    saveGoals(goals);
    const loaded = loadGoals();
    expect(loaded).toEqual(goals);
  });

  it('should handle corrupt JSON gracefully for profile', () => {
    localStorage.setItem('ecoguide_profile', '{invalid_json');
    expect(loadProfile()).toBeNull();
  });

  it('should handle corrupt JSON gracefully for goals', () => {
    localStorage.setItem('ecoguide_goals', '{invalid_json');
    expect(loadGoals()).toEqual([]);
  });

  it('should save and load history', () => {
    const history = [{ date: '2023-01-01', totalAnnualKgCO2: 100 }] as unknown as import('../../types/carbon').EmissionSnapshot[];
    saveHistory(history);
    expect(loadHistory()).toEqual(history);
  });

  it('should add history snapshot and trim to 24 items', () => {
    for (let i = 0; i < 30; i++) {
      addHistorySnapshot({ date: `2023-01-${i}`, totalAnnualKgCO2: i } as unknown as import('../../types/carbon').EmissionSnapshot);
    }
    const history = loadHistory();
    expect(history.length).toBe(24);
    expect(history[history.length - 1].totalAnnualKgCO2).toBe(29);
  });

  it('should export data correctly', () => {
    saveProfile({ id: '1', name: 'Test', transport: {}, electricity: {}, food: {} } as unknown as import('../../types/carbon').UserProfile);
    saveGoals([{ id: 'g1', title: 'Goal 1' }] as unknown as import('../../types/carbon').Goal[]);
    const exported = exportData();
    expect(exported).toContain('"version":1');
    expect(exported).toContain('"id":"1"');
    expect(exported).toContain('"Goal 1"');
  });

  it('should clear storage', () => {
    saveProfile({ id: '1', name: 'Test', transport: {}, electricity: {}, food: {} } as unknown as import('../../types/carbon').UserProfile);
    saveGoals([{} as unknown as import('../../types/carbon').Goal]);
    clearAllData();
    expect(loadProfile()).toBeNull();
    expect(loadGoals()).toEqual([]);
  });
});
