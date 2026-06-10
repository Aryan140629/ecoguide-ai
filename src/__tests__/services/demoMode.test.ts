import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadDemoData } from '../../services/demoMode';
import { loadProfile, loadGoals, loadHistory } from '../../services/storage';

describe('Demo Mode Service', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    // @ts-expect-error mocking window.location
    delete window.location;
    // @ts-expect-error mocking window.location
    window.location = { reload: vi.fn() } as unknown as Location;
  });

  afterEach(() => {
    // @ts-expect-error restoring location
    window.location = originalLocation;
  });

  it('should save demo profile, goals, and history, then reload', () => {
    loadDemoData();

    const profile = loadProfile();
    expect(profile).toBeDefined();
    expect(profile?.id).toBe('demo_user_1');
    expect(profile?.name).toBe('Alex (Demo)');

    const goals = loadGoals();
    expect(goals.length).toBe(2);
    expect(goals[0].id).toBe('g1');

    const history = loadHistory();
    expect(history.length).toBe(6);

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
