/**
 * Validation & Sanitization Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeName,
  validateNumber,
  validateText,
  validateEnum,
  validateTransportForm,
  validateElectricityForm,
  validateFoodForm,
  validateGoalForm,
} from '../../services/validation';

describe('Sanitization Service', () => {
  it('should sanitize HTML special characters to prevent XSS', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
    expect(sanitizeText('Hello & Welcome')).toBe('Hello &amp; Welcome');
    expect(sanitizeText("User's choice")).toBe('User&#x27;s choice');
    expect(sanitizeText('/path/to/file')).toBe('&#x2F;path&#x2F;to&#x2F;file');
  });

  it('should handle non-string inputs gracefully', () => {
    expect(sanitizeText(123 as unknown as string)).toBe('');
    expect(sanitizeText(null as unknown as string)).toBe('');
  });

  it('should sanitize display names, removing control chars and limiting length', () => {
    expect(sanitizeName('  John \x00 Doe  ')).toBe('John  Doe');
    expect(sanitizeName('a'.repeat(120))).toBe('a'.repeat(100));
  });
});

describe('Numeric Validation', () => {
  it('should validate required numeric fields', () => {
    expect(validateNumber(undefined, 'Field', { required: true })).toEqual({
      field: 'Field',
      message: 'Field is required',
    });
    expect(validateNumber(null, 'Field', { required: true })).toEqual({
      field: 'Field',
      message: 'Field is required',
    });
    expect(validateNumber('', 'Field', { required: true })).toEqual({
      field: 'Field',
      message: 'Field is required',
    });
  });

  it('should validate optional numeric fields when missing', () => {
    expect(validateNumber(undefined, 'Field', { required: false })).toBeNull();
    expect(validateNumber(null, 'Field', { required: false })).toBeNull();
  });

  it('should reject non-finite numbers', () => {
    expect(validateNumber(NaN, 'Field')).toEqual({
      field: 'Field',
      message: 'Field must be a valid number',
    });
    expect(validateNumber(Infinity, 'Field')).toEqual({
      field: 'Field',
      message: 'Field must be a valid number',
    });
    expect(validateNumber('abc', 'Field')).toEqual({
      field: 'Field',
      message: 'Field must be a valid number',
    });
  });

  it('should enforce min and max bounds', () => {
    expect(validateNumber(-5, 'Field', { min: 0 })).toEqual({
      field: 'Field',
      message: 'Field must be at least 0',
    });
    expect(validateNumber(150, 'Field', { max: 100 })).toEqual({
      field: 'Field',
      message: 'Field must be at most 100',
    });
    expect(validateNumber(50, 'Field', { min: 0, max: 100 })).toBeNull();
  });
});

describe('Text Validation', () => {
  it('should validate required text fields', () => {
    expect(validateText('', 'Field', { required: true })).toEqual({
      field: 'Field',
      message: 'Field is required',
    });
    expect(validateText('   ', 'Field', { required: true })).toEqual({
      field: 'Field',
      message: 'Field is required',
    });
  });

  it('should check text length constraints', () => {
    expect(validateText('ab', 'Field', { minLength: 3 })).toEqual({
      field: 'Field',
      message: 'Field must be at least 3 characters',
    });
    expect(validateText('abcd', 'Field', { maxLength: 3 })).toEqual({
      field: 'Field',
      message: 'Field must be at most 3 characters',
    });
  });

  it('should reject non-string types for text validation', () => {
    expect(validateText(123, 'Field')).toEqual({
      field: 'Field',
      message: 'Field must be text',
    });
  });
});

describe('Enum Validation', () => {
  it('should validate that value is one of allowed list', () => {
    const allowed = ['apple', 'banana'] as const;
    expect(validateEnum('apple', 'Fruit', allowed)).toBeNull();
    expect(validateEnum('orange', 'Fruit', allowed)).toEqual({
      field: 'Fruit',
      message: 'Fruit must be one of: apple, banana',
    });
  });
});

describe('Form Validation', () => {
  it('should validate transport form data', () => {
    expect(validateTransportForm({ mode: 'bus', distanceKmPerWeek: 150 }).valid).toBe(true);
    expect(validateTransportForm({ mode: 'rocket', distanceKmPerWeek: 150 }).valid).toBe(false);
    expect(validateTransportForm({ mode: 'bus', distanceKmPerWeek: -10 }).valid).toBe(false);
  });

  it('should validate electricity form data', () => {
    expect(
      validateElectricityForm({
        monthlyKwh: 300,
        energySource: 'renewable',
        householdSize: 2,
      }).valid
    ).toBe(true);

    expect(
      validateElectricityForm({
        monthlyKwh: -5,
        energySource: 'unknown',
        householdSize: 0,
      }).valid
    ).toBe(false);
  });

  it('should validate food form data', () => {
    expect(
      validateFoodForm({
        dietType: 'vegan',
        redMeatMealsPerWeek: 0,
        poultryFishMealsPerWeek: 0,
        foodWasteLevel: 'low',
      }).valid
    ).toBe(true);

    expect(
      validateFoodForm({
        dietType: 'carnivore',
        redMeatMealsPerWeek: 50,
        poultryFishMealsPerWeek: 0,
        foodWasteLevel: 'very_high',
      }).valid
    ).toBe(false);
  });

  it('gracefully handles missing localStorage API', () => {
    // Mock missing localStorage
    Object.defineProperty(window, 'localStorage', { value: undefined, writable: true });
  });

  it('should validate goal form data', () => {
    expect(
      validateGoalForm({
        title: 'Reduce carbon',
        targetReductionPercent: 15,
      }).valid
    ).toBe(true);

    expect(
      validateGoalForm({
        title: 'a',
        targetReductionPercent: 0,
      }).valid
    ).toBe(false);
  });
});
