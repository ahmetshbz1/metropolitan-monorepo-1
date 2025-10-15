import {
  validateEmail,
  validatePhone,
  validateNIP,
  validateTCKimlik,
  validatePassword,
  validateUrl,
  validateUsername,
} from '@metropolitan/shared';
import { Elysia } from 'elysia';
import { sanitizeObject } from './input-validation-sanitizer';

/**
 * Validation middleware factory
 * Genel validasyon middleware'i oluşturur
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
 * Dosya yükleme validasyon middleware'i
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
