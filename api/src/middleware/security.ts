import rateLimit from 'express-rate-limit';
import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Rate limiter for login endpoints
 * 5 attempts per 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter for exam password attempts
 * 3 attempts per 5 minutes per user per exam
 */
export const examPasswordLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: 'Too many incorrect password attempts. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = req.user?.userId || req.ip;
    const examId = req.params.id || 'unknown';
    return `${userId}:${examId}`;
  },
});

/**
 * Sanitize text input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return xss(input, {
    whiteList: {}, // No HTML allowed
    stripIgnoreTag: true,
  });
}

/**
 * Middleware to validate request and sanitize inputs
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array(),
      });
    }
    
    next();
  };
}

/**
 * Common validation rules
 */
export const validationRules = {
  username: body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  password: body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  examPassword: body('password')
    .isLength({ min: 8, max: 8 })
    .withMessage('Exam password must be exactly 8 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Exam password must be alphanumeric'),
  
  subjectName: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be between 2 and 100 characters')
    .customSanitizer(sanitizeInput),
  
  questionText: body('*.questionText')
    .trim()
    .notEmpty()
    .withMessage('Question text is required')
    .customSanitizer(sanitizeInput),
  
  option: (field: string) => body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .customSanitizer(sanitizeInput),
  
  correctAnswer: body('*.correctAnswer')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Correct answer must be A, B, C, or D'),
  
  duration: body('durationMinutes')
    .isInt({ min: 1, max: 300 })
    .withMessage('Duration must be between 1 and 300 minutes'),
};
