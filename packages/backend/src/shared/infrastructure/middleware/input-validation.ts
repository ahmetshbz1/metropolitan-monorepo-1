import { Elysia } from 'elysia';

/**
 * Input validation middleware for Elysia
 * Provides comprehensive input sanitization and validation
 */

// Re-export all schemas
export { validationSchemas, routeValidations } from './input-validation-schemas';

// Re-export sanitizer
export { sanitizeObject, type SanitizableValue } from './input-validation-sanitizer';

// Re-export middleware factories
export {
  createValidationMiddleware,
  createFileValidationMiddleware,
} from './input-validation-middleware';

/**
 * Global input validation setup
 * Global validasyon kurulumu
 */
export const setupInputValidation = (app: Elysia) => {
  // Import createValidationMiddleware locally to avoid circular dependency
  const { createValidationMiddleware } = require('./input-validation-middleware');

  // Apply global validation middleware
  app.use(createValidationMiddleware());

  // Note: Validation errors are already logged by global error handler in app.ts
  return app;
};
