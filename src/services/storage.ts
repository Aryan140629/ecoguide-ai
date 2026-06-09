/**
 * Safe Local Storage Service
 *
 * Type-safe wrapper around localStorage with:
 * - JSON schema validation on read
 * - Graceful fallback on corruption/quota exceeded
 * - Defensive parsing (try-catch on all JSON.parse)
 * - Versioned storage keys to handle migrations
 */

import type { UserProfile, Goal, EmissionSnapshot } from '../types/carbon';

const STORAGE_VERSION = 1;
const PREFIX = `ecoguide_v${STORAGE_VERSION}_`;

const KEYS = {
  profile: `${PREFIX}profile`,
  goals: `${PREFIX}goals`,
  history: `${PREFIX}history`,
  adoptedRecommendations: `${PREFIX}adopted`,
} as const;

// ─── Storage Availability ───────────────────────────────────────

/**
 * Check if localStorage is available and writable.
 */
function isStorageAvailable(): boolean {
  try {
    const testKey = `${PREFIX}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ─── Generic Read / Write ───────────────────────────────────────

function safeRead<T>(key: string): T | null {
  if (!isStorageAvailable()) return null;

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    const parsed = JSON.parse(raw) as T;
    return parsed;
  } catch {
    // Data is corrupted — remove it
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
    return null;
  }
}

function safeWrite<T>(key: string, data: T): boolean {
  if (!isStorageAvailable()) return false;

  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Likely quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('EcoGuide: localStorage quota exceeded');
    }
    return false;
  }
}

// ─── Profile ────────────────────────────────────────────────────

export function saveProfile(profile: UserProfile): boolean {
  return safeWrite(KEYS.profile, profile);
}

export function loadProfile(): UserProfile | null {
  const data = safeRead<UserProfile>(KEYS.profile);
  if (data === null) return null;

  // Basic shape validation
  if (
    typeof data.id !== 'string' ||
    typeof data.name !== 'string' ||
    typeof data.transport !== 'object' ||
    typeof data.electricity !== 'object' ||
    typeof data.food !== 'object'
  ) {
    return null;
  }

  return data;
}

// ─── Goals ──────────────────────────────────────────────────────

export function saveGoals(goals: readonly Goal[]): boolean {
  return safeWrite(KEYS.goals, goals);
}

export function loadGoals(): Goal[] {
  const data = safeRead<Goal[]>(KEYS.goals);
  if (!Array.isArray(data)) return [];
  return data;
}

// ─── Emission History ───────────────────────────────────────────

export function saveHistory(history: readonly EmissionSnapshot[]): boolean {
  return safeWrite(KEYS.history, history);
}

export function loadHistory(): EmissionSnapshot[] {
  const data = safeRead<EmissionSnapshot[]>(KEYS.history);
  if (!Array.isArray(data)) return [];
  return data;
}

/**
 * Add a new emission snapshot to history.
 * Keeps maximum 24 monthly snapshots.
 */
export function addHistorySnapshot(snapshot: EmissionSnapshot): boolean {
  const history = loadHistory();
  history.push(snapshot);

  // Keep only last 24 entries
  const trimmed = history.slice(-24);
  return saveHistory(trimmed);
}

// ─── Clear All Data ─────────────────────────────────────────────

export function clearAllData(): void {
  if (!isStorageAvailable()) return;

  try {
    for (const key of Object.values(KEYS)) {
      localStorage.removeItem(key);
    }
  } catch {
    // Silent fail
  }
}

/**
 * Export all stored data as a JSON string for backup.
 */
export function exportData(): string {
  return JSON.stringify({
    version: STORAGE_VERSION,
    profile: loadProfile(),
    goals: loadGoals(),
    history: loadHistory(),
    exportedAt: new Date().toISOString(),
  });
}
