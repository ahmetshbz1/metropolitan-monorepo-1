import { Elysia, t } from 'elysia';
import {
  escapeHtml,
  sanitizeSqlInput,
  validateEmail,
  validatePhone,
  validateUrl,
  validateNIP,
  validateTCKimlik,
  validatePassword,
  validateUsername,
  validateUUID,
  validateLength,
} from '@metropolitan/shared';

/**
 * Input validation middleware for Elysia
 * Provides comprehensive input sanitization and validation
 */

// Common validation schemas
export const validationSchemas = {
  // User schemas
  email: t.String({
    format: 'email',
    minLength: 5,
    maxLength: 254,
    error: 'Geçersiz email adresi',
  }),

  phone: t.String({
    pattern: '^(\\+90|0)?[1-9]\\d{9}$',
    error: 'Geçersiz telefon numarası',
  }),

  password: t.String({
    minLength: 8,
    maxLength: 128,
    error: 'Şifre en az 8 karakter olmalıdır',
  }),

  username: t.String({
    pattern: '^[a-zA-Z0-9_-]{3,20}$',
    error: 'Kullanıcı adı 3-20 karakter arasında olmalı ve sadece harf, rakam, tire ve alt çizgi içerebilir',
  }),

  // Address schemas
  postalCode: t.String({
    pattern: '^\\d{5}$',
    error: 'Posta kodu 5 haneli olmalıdır',
  }),

  // Company schemas
  nip: t.String({
    pattern: '^\\d{10}$',
    error: 'Geçersiz NIP numarası',
  }),

  // Turkish ID
  tcKimlik: t.String({
    pattern: '^\\d{11}$',
    error: 'Geçersiz TC Kimlik Numarası',
  }),

  // UUID
  uuid: t.String({
    format: 'uuid',
    error: 'Geçersiz UUID formatı',
  }),

  // Common string validations
  shortText: t.String({
    minLength: 1,
    maxLength: 100,
  }),

  mediumText: t.String({
    minLength: 1,
    maxLength: 500,
  }),

  longText: t.String({
    minLength: 1,
    maxLength: 5000,
  }),

  // Numeric validations
  positiveInteger: t.Number({
    minimum: 1,
    error: 'Pozitif tam sayı olmalıdır',
  }),

  price: t.Number({
    minimum: 0,
    multipleOf: 0.01,
    error: 'Geçersiz fiyat formatı',
  }),

  quantity: t.Number({
    minimum: 1,
    maximum: 9999,
    error: 'Miktar 1-9999 arasında olmalıdır',
  }),

  // Date validations
  date: t.String({
    format: 'date-time',
    error: 'Geçersiz tarih formatı',
  }),

  // URL validation
  url: t.String({
    format: 'uri',
    error: 'Geçersiz URL formatı',
  }),
};

/**
 * Sanitize all string inputs in an object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeSqlInput(escapeHtml(obj.trim()));
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeSqlInput(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validation middleware factory
 */
export const createValidationMiddleware = () => {
  return new Elysia()
    .derive(({ body, query, params }) => {
      // Sanitize all inputs
      const sanitizedBody = body ? sanitizeObject(body) : undefined;
      const sanitizedQuery = query ? sanitizeObject(query) : undefined;
      const sanitizedParams = params ? sanitizeObject(params) : undefined;

      return {
        sanitizedBody,
        sanitizedQuery,
        sanitizedParams,
      };
    })
    .onBeforeHandle(({ sanitizedBody, set }) => {
      // Additional custom validations based on content
      if (sanitizedBody) {
        // Email validation
        if (sanitizedBody.email && !validateEmail(sanitizedBody.email)) {
          set.status = 400;
          return {
            success: false,
            error: 'Geçersiz email adresi',
          };
        }

        // Phone validation
        if (sanitizedBody.phone && !validatePhone(sanitizedBody.phone)) {
          set.status = 400;
          return {
            success: false,
            error: 'Geçersiz telefon numarası',
          };
        }

        // Password strength validation
        if (sanitizedBody.password) {
          const passwordValidation = validatePassword(sanitizedBody.password);
          if (!passwordValidation.isValid) {
            set.status = 400;
            return {
              success: false,
              error: 'Şifre yeterince güçlü değil',
              details: passwordValidation.issues,
            };
          }
        }

        // NIP validation (for Polish tax numbers)
        if (sanitizedBody.nip && !validateNIP(sanitizedBody.nip)) {
          set.status = 400;
          return {
            success: false,
            error: 'Geçersiz NIP numarası',
          };
        }

        // Turkish ID validation
        if (sanitizedBody.tcKimlik && !validateTCKimlik(sanitizedBody.tcKimlik)) {
          set.status = 400;
          return {
            success: false,
            error: 'Geçersiz TC Kimlik Numarası',
          };
        }

        // URL validation
        if (sanitizedBody.url && !validateUrl(sanitizedBody.url)) {
          set.status = 400;
          return {
            success: false,
            error: 'Geçersiz URL',
          };
        }

        // Username validation
        if (sanitizedBody.username && !validateUsername(sanitizedBody.username)) {
          set.status = 400;
          return {
            success: false,
            error: 'Geçersiz kullanıcı adı',
          };
        }
      }
    });
};

/**
 * File upload validation middleware
 */
export const createFileValidationMiddleware = (options: {
  maxSizeInMB?: number;
  allowedExtensions?: string[];
} = {}) => {
  const { maxSizeInMB = 10, allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'] } = options;

  return new Elysia()
    .onBeforeHandle(({ request, set }) => {
      // Check if request has files
      const contentType = request.headers.get('content-type');

      if (contentType?.includes('multipart/form-data')) {
        // File validation logic here
        // This would need to be implemented based on how Elysia handles file uploads

        // Example validation structure:
        // 1. Check file size
        // 2. Check file extension
        // 3. Check MIME type
        // 4. Scan for malicious content (optional)
      }
    });
};

/**
 * Create specific validation schemas for routes
 */
export const routeValidations = {
  // Auth routes
  register: t.Object({
    phone: validationSchemas.phone,
    firstName: validationSchemas.shortText,
    lastName: validationSchemas.shortText,
    userType: t.Union([t.Literal('individual'), t.Literal('corporate')]),
  }),

  login: t.Object({
    phone: validationSchemas.phone,
  }),

  verifyOtp: t.Object({
    phone: validationSchemas.phone,
    otp: t.String({ minLength: 6, maxLength: 6 }),
  }),

  // User routes
  updateProfile: t.Object({
    firstName: t.Optional(validationSchemas.shortText),
    lastName: t.Optional(validationSchemas.shortText),
    email: t.Optional(validationSchemas.email),
  }),

  // Address routes
  createAddress: t.Object({
    title: validationSchemas.shortText,
    firstName: validationSchemas.shortText,
    lastName: validationSchemas.shortText,
    phone: validationSchemas.phone,
    address: validationSchemas.mediumText,
    city: validationSchemas.shortText,
    district: validationSchemas.shortText,
    postalCode: validationSchemas.postalCode,
  }),

  // Order routes
  createOrder: t.Object({
    addressId: validationSchemas.uuid,
    paymentMethod: t.Union([
      t.Literal('credit_card'),
      t.Literal('bank_transfer'),
      t.Literal('cash_on_delivery'),
    ]),
    note: t.Optional(validationSchemas.mediumText),
  }),

  // Product routes
  searchProducts: t.Object({
    query: t.Optional(validationSchemas.shortText),
    categoryId: t.Optional(validationSchemas.uuid),
    minPrice: t.Optional(validationSchemas.price),
    maxPrice: t.Optional(validationSchemas.price),
    page: t.Optional(validationSchemas.positiveInteger),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  }),

  // Cart routes
  addToCart: t.Object({
    productId: validationSchemas.uuid,
    quantity: validationSchemas.quantity,
  }),

  updateCartItem: t.Object({
    quantity: validationSchemas.quantity,
  }),
};

/**
 * Global input validation setup
 */
export const setupInputValidation = (app: Elysia) => {
  // Apply global validation middleware
  app.use(createValidationMiddleware());

  // Log validation errors in development
  if (process.env.NODE_ENV === 'development') {
    app.onError(({ error, code }) => {
      if (code === 'VALIDATION') {
        console.error('Validation error:', error);
      }
    });
  }

  return app;
};