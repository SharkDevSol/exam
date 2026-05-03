/**
 * Form validation utilities
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  email: (message = 'Invalid email address'): ValidationRule => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: number) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: number) => value <= max,
    message: message || `Must be at most ${max}`,
  }),

  exactLength: (length: number, message?: string): ValidationRule => ({
    validate: (value: string | any[]) => value.length === length,
    message: message || `Must be exactly ${length} characters`,
  }),

  alphanumeric: (message = 'Must contain only letters and numbers'): ValidationRule => ({
    validate: (value: string) => /^[a-zA-Z0-9]+$/.test(value),
    message,
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message,
  }),
};

/**
 * Validate a single field against multiple rules
 */
export function validateField(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message;
    }
  }
  return null;
}

/**
 * Validate an entire form object
 */
export function validateForm<T extends Record<string, any>>(
  values: T,
  rules: Partial<Record<keyof T, ValidationRule[]>>
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const field in rules) {
    const fieldRules = rules[field];
    if (fieldRules) {
      const error = validateField(values[field], fieldRules);
      if (error) {
        errors[field] = error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Hook-like validator for React forms
 */
export function createValidator<T extends Record<string, any>>(
  rules: Partial<Record<keyof T, ValidationRule[]>>
) {
  return (values: T): ValidationResult => validateForm(values, rules);
}

/**
 * Exam-specific validators
 */
export const examValidators = {
  questionCount: (count: number) =>
    validationRules.custom(
      () => count === 100,
      'Exam must contain exactly 100 questions'
    ),

  examPassword: () =>
    validationRules.custom(
      (value: string) => /^[a-zA-Z0-9]{8}$/.test(value),
      'Exam password must be 8 alphanumeric characters'
    ),

  duration: () =>
    validationRules.custom(
      (value: number) => value > 0 && value <= 480,
      'Duration must be between 1 and 480 minutes (8 hours)'
    ),

  answerOption: () =>
    validationRules.custom(
      (value: string) => ['A', 'B', 'C', 'D'].includes(value),
      'Answer must be A, B, C, or D'
    ),
};
