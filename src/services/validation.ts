/**
 * Input Validation & Sanitization Service
 *
 * Provides defensive validation for all form inputs and
 * text sanitization to prevent XSS attacks.
 */

import type { ValidationResult, ValidationError } from '../types/carbon';

// ─── Sanitization ───────────────────────────────────────────────

/**
 * Sanitize a text string to prevent XSS.
 * Replaces potentially dangerous HTML characters with entities.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize a string for safe use as a display name.
 * Strips control characters and limits length.
 */
export function sanitizeName(input: string): string {
  if (typeof input !== 'string') return '';
  // Remove control characters
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\x00-\x1F\x7F]/g, '').trim();
  // Limit length
  return sanitizeText(cleaned.slice(0, 100));
}

// ─── Numeric Validation ─────────────────────────────────────────

/**
 * Validate that a value is a non-negative finite number within range.
 */
export function validateNumber(
  value: unknown,
  field: string,
  options: { min?: number; max?: number; required?: boolean } = {}
): ValidationError | null {
  const { min = 0, max = 100000, required = false } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field, message: `${field} is required` };
    }
    return null;
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  if (!Number.isFinite(num)) {
    return { field, message: `${field} must be a valid number` };
  }

  if (num < min) {
    return { field, message: `${field} must be at least ${min}` };
  }

  if (num > max) {
    return { field, message: `${field} must be at most ${max}` };
  }

  return null;
}

/**
 * Validate a required text field.
 */
export function validateText(
  value: unknown,
  field: string,
  options: { minLength?: number; maxLength?: number; required?: boolean } = {}
): ValidationError | null {
  const { minLength = 0, maxLength = 200, required = false } = options;

  if (value === undefined || value === null || value === '') {
    if (required) {
      return { field, message: `${field} is required` };
    }
    return null;
  }

  if (typeof value !== 'string') {
    return { field, message: `${field} must be text` };
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    return { field, message: `${field} is required` };
  }

  if (trimmed.length < minLength) {
    return { field, message: `${field} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { field, message: `${field} must be at most ${maxLength} characters` };
  }

  return null;
}

/**
 * Validate that a value is one of the allowed options.
 */
export function validateEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): ValidationError | null {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    return { field, message: `${field} must be one of: ${allowed.join(', ')}` };
  }
  return null;
}

// ─── Form Validators ────────────────────────────────────────────

export function validateTransportForm(data: {
  mode: string;
  distanceKmPerWeek: unknown;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const validModes = [
    'car_gasoline', 'car_diesel', 'car_hybrid', 'car_electric',
    'bus', 'train', 'bicycle', 'walking', 'motorcycle', 'airplane',
  ] as const;

  const modeError = validateEnum(data.mode, 'Transport mode', validModes);
  if (modeError) errors.push(modeError);

  const distanceError = validateNumber(data.distanceKmPerWeek, 'Distance (km/week)', {
    min: 0,
    max: 5000,
    required: true,
  });
  if (distanceError) errors.push(distanceError);

  return { valid: errors.length === 0, errors };
}

export function validateElectricityForm(data: {
  monthlyKwh: unknown;
  energySource: string;
  householdSize: unknown;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const kwhError = validateNumber(data.monthlyKwh, 'Monthly kWh', {
    min: 0,
    max: 50000,
    required: true,
  });
  if (kwhError) errors.push(kwhError);

  const validSources = ['grid_mixed', 'renewable', 'coal', 'natural_gas'] as const;
  const sourceError = validateEnum(data.energySource, 'Energy source', validSources);
  if (sourceError) errors.push(sourceError);

  const sizeError = validateNumber(data.householdSize, 'Household size', {
    min: 1,
    max: 20,
    required: true,
  });
  if (sizeError) errors.push(sizeError);

  return { valid: errors.length === 0, errors };
}

export function validateFoodForm(data: {
  dietType: string;
  redMeatMealsPerWeek: unknown;
  poultryFishMealsPerWeek: unknown;
  foodWasteLevel: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const validDiets = ['heavy_meat', 'average', 'low_meat', 'pescatarian', 'vegetarian', 'vegan'] as const;
  const dietError = validateEnum(data.dietType, 'Diet type', validDiets);
  if (dietError) errors.push(dietError);

  const redMeatError = validateNumber(data.redMeatMealsPerWeek, 'Red meat meals/week', {
    min: 0,
    max: 21,
    required: true,
  });
  if (redMeatError) errors.push(redMeatError);

  const poultryError = validateNumber(data.poultryFishMealsPerWeek, 'Poultry/fish meals/week', {
    min: 0,
    max: 21,
    required: true,
  });
  if (poultryError) errors.push(poultryError);

  const validWaste = ['low', 'medium', 'high'] as const;
  const wasteError = validateEnum(data.foodWasteLevel, 'Food waste level', validWaste);
  if (wasteError) errors.push(wasteError);

  return { valid: errors.length === 0, errors };
}

export function validateGoalForm(data: {
  title: unknown;
  targetReductionPercent: unknown;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const titleError = validateText(data.title, 'Goal title', {
    required: true,
    minLength: 3,
    maxLength: 100,
  });
  if (titleError) errors.push(titleError);

  const targetError = validateNumber(data.targetReductionPercent, 'Reduction target (%)', {
    min: 1,
    max: 100,
    required: true,
  });
  if (targetError) errors.push(targetError);

  return { valid: errors.length === 0, errors };
}
